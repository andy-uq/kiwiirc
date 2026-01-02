'kiwi public';

/** @module */

import Logger from '@/libs/Logger';

const log = Logger.namespace('batch');

/**
 * Batch types that should coalesce messages from the same sender into a single message.
 * This is useful for LLM responses or other multi-line content that was split due to
 * IRC line length limits.
 */
const COALESCE_BATCH_TYPES = [
    'draft/multiline',
    'multiline',
];

/**
 * Check if a batch type should have its messages coalesced
 * @param {string} type - The batch type
 * @returns {boolean}
 */
function shouldCoalesce(type) {
    return COALESCE_BATCH_TYPES.includes(type?.toLowerCase());
}

/**
 * Generate a unique batch ID for outgoing batches
 * @returns {string} A unique batch reference tag
 */
function generateBatchId() {
    return 'kiwi_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Adds generic IRCv3 batch support to irc-framework.
 *
 * irc-framework already handles batch buffering internally - it collects all
 * commands within a batch and then executes them when the batch ends.
 *
 * This middleware:
 * - Requests the batch and draft/multiline capabilities
 * - Exposes shouldCoalesce() for other handlers to check batch types
 * - Listens for batch end events and emits coalesced messages
 *
 * The actual message suppression happens in IrcClient.js's message handler,
 * which checks client.batch.shouldCoalesce() to skip individual messages.
 *
 * @see https://ircv3.net/specs/extensions/batch
 */
export default function batchMiddleware() {
    return function middleware(client, rawEvents, parsedEvents) {
        client.requestCap('batch');
        client.requestCap('draft/multiline');

        // Expose batch utilities on the client
        client.batch = {
            shouldCoalesce,
            /**
             * Check if the server supports multiline batches
             * @returns {boolean}
             */
            supportsMultiline() {
                return client.network.cap.isEnabled('draft/multiline') ||
                       client.network.cap.isEnabled('multiline');
            },
            /**
             * Send a multiline message as a batch
             * @param {string} target - The target channel or nick
             * @param {string[]} lines - Array of message lines to send
             * @param {string} [type='privmsg'] - Message type: 'privmsg', 'notice', or 'action'
             */
            sendMultiline(target, lines, type = 'privmsg') {
                if (!lines || lines.length === 0) {
                    return;
                }

                // If only one line or multiline not supported, send normally
                if (lines.length === 1 || !this.supportsMultiline()) {
                    lines.forEach((line) => {
                        if (type === 'action') {
                            client.action(target, line);
                        } else if (type === 'notice') {
                            client.notice(target, line);
                        } else {
                            client.say(target, line);
                        }
                    });
                    return;
                }

                const batchId = generateBatchId();
                log.debug('Sending multiline batch:', { batchId, target, lineCount: lines.length });

                // Start the batch
                client.raw('BATCH', '+' + batchId, 'draft/multiline', target);

                // Send each line with the batch tag
                lines.forEach((line) => {
                    let command;
                    let message = line;

                    if (type === 'action') {
                        command = 'PRIVMSG';
                        message = '\x01ACTION ' + line + '\x01';
                    } else if (type === 'notice') {
                        command = 'NOTICE';
                    } else {
                        command = 'PRIVMSG';
                    }

                    // Send raw with batch tag
                    client.raw(`@batch=${batchId} ${command} ${target} :${message}`);
                });

                // End the batch
                client.raw('BATCH', '-' + batchId);

                log.debug('Multiline batch sent:', { batchId });
            },
        };

        // Listen to irc-framework's batch end event to emit coalesced messages
        // At this point, irc-framework has already executed all the individual
        // message commands (which we skip in IrcClient.js for coalesce batches)
        client.on('batch end', (event) => {
            if (!shouldCoalesce(event.type)) {
                return;
            }

            log.debug('Coalesce batch end:', {
                id: event.id,
                type: event.type,
                commandCount: event.commands?.length,
            });

            if (!event.commands || event.commands.length === 0) {
                return;
            }

            const coalesced = coalesceMessages(event);
            if (coalesced) {
                log.debug('Emitting coalesced message:', {
                    batchId: event.id,
                    messageCount: event.commands.length,
                    nick: coalesced.nick,
                    target: coalesced.target,
                });

                // Emit our custom event with the coalesced message
                client.emit('batch end coalesced', {
                    id: event.id,
                    type: event.type,
                    params: event.params,
                    coalescedMessage: coalesced,
                });
            }
        });

        /**
         * Coalesce multiple commands into a single message object.
         * Used for multiline batches where message content was split due to line limits.
         * @param {object} event - The batch end event from irc-framework
         * @returns {object|null} The coalesced message or null
         */
        function coalesceMessages(event) {
            const commands = event.commands;
            if (!commands || !commands.length) {
                return null;
            }

            // Use the first command as the template
            const first = commands[0];
            const messageTexts = [];

            commands.forEach((cmd) => {
                // Extract the message text - it's the last param for PRIVMSG/NOTICE
                if (cmd.params && cmd.params.length > 1) {
                    messageTexts.push(cmd.params[cmd.params.length - 1]);
                }
            });

            // Determine message type from the command
            let type = 'privmsg';
            if (first.command === 'NOTICE') {
                type = 'notice';
            }
            // Check for ACTION (CTCP ACTION is sent as PRIVMSG with \x01ACTION...\x01)
            const firstMsg = first.params?.[first.params.length - 1] || '';
            if (firstMsg.startsWith('\x01ACTION ')) {
                type = 'action';
                // Strip the ACTION wrapper from all messages
                messageTexts.length = 0;
                commands.forEach((cmd) => {
                    let text = cmd.params?.[cmd.params.length - 1] || '';
                    if (text.startsWith('\x01ACTION ')) {
                        text = text.slice(8, -1); // Remove \x01ACTION and trailing \x01
                    }
                    messageTexts.push(text);
                });
            }

            return {
                nick: first.nick,
                ident: first.ident,
                hostname: first.hostname,
                target: first.params?.[0],
                message: messageTexts.join('\n'),
                type: type,
                tags: first.tags || {},
                time: first.getServerTime?.() || null,
                batch: {
                    id: event.id,
                    type: event.type,
                    params: event.params,
                },
            };
        }
    };
}
