'kiwi public';

/** @module */

/**
 * Available reactions - limited set of emojis users can pick from
 */
export const REACTIONS = [
    { emoji: '\u{1F44D}', name: 'thumbs_up', twemoji: '1f44d' },
    { emoji: '\u{1F44E}', name: 'thumbs_down', twemoji: '1f44e' },
    { emoji: '\u{2764}\u{FE0F}', name: 'heart', twemoji: '2764' },
    { emoji: '\u{1F525}', name: 'fire', twemoji: '1f525' },
    { emoji: '\u{1F602}', name: 'joy', twemoji: '1f602' },
    { emoji: '\u{1F62D}', name: 'sob', twemoji: '1f62d' },
    { emoji: '\u{1F926}', name: 'facepalm', twemoji: '1f926' },
    { emoji: '\u{1F937}', name: 'shrug', twemoji: '1f937' },
    { emoji: '\u{1F608}', name: 'smiling_imp', twemoji: '1f608' },
    { emoji: '\u{1F47F}', name: 'angry_imp', twemoji: '1f47f' },
];

/**
 * Check if an emoji is in our allowed reactions list
 */
export function isValidReaction(emoji) {
    return REACTIONS.some((r) => r.emoji === emoji);
}

/**
 * Get the twemoji code for a given emoji
 * @param {string} emoji - The emoji character
 * @returns {string|null} - The twemoji code or null if not found
 */
export function getReactionTwemoji(emoji) {
    const reaction = REACTIONS.find((r) => r.emoji === emoji);
    return reaction ? reaction.twemoji : null;
}

/**
 * Adds the draft/react spec support to irc-framework
 * Handles incoming TAGMSG with +draft/react and +draft/reply tags
 */
export default function reactionMiddleware() {
    return function middleware(client, rawEvents, parsedEvents) {
        client.requestCap('draft/react');
        addFunctionsToClient(client);
        rawEvents.use(theMiddleware);
    };

    function theMiddleware(command, message, rawLine, client, next) {
        // Only handle TAGMSG with reaction tags
        if (command !== 'TAGMSG') {
            next();
            return;
        }

        const reactTag = message.tags['+draft/react'] || message.tags['draft/react'];
        const replyTag = message.tags['+draft/reply'] || message.tags['draft/reply'];

        if (!reactTag || !replyTag) {
            next();
            return;
        }

        // Validate the reaction emoji
        if (!isValidReaction(reactTag)) {
            next();
            return;
        }

        // Safety check for required properties
        if (!message.params || !message.params[0] || !client.user || !client.user.nick) {
            next();
            return;
        }

        // Determine the target buffer
        // If we are params[0] then the target is the sender (direct message)
        let target = (message.params[0].toLowerCase() === client.user.nick.toLowerCase())
            ? message.nick
            : message.params[0];

        client.emit('reaction', {
            target: target,
            msgid: replyTag,
            emoji: reactTag,
            nick: message.nick,
            ident: message.ident,
            hostname: message.hostname,
            time: Date.now(),
        });

        next();
    }
}

function addFunctionsToClient(client) {
    let reactions = client.reactions = {};

    /**
     * Check if the server supports reactions
     */
    reactions.isSupported = function isSupported() {
        // Check if server supports message-tags and draft/react
        return client.network.cap.isEnabled('message-tags') &&
            client.network.cap.isEnabled('draft/react');
    };

    /**
     * Send a reaction to a message
     * @param {string} target - Channel or nick to send to
     * @param {string} msgid - The msgid of the message being reacted to
     * @param {string} emoji - The reaction emoji
     * @returns {boolean} - Whether the reaction was sent
     */
    reactions.send = function send(target, msgid, emoji) {
        if (!isValidReaction(emoji)) {
            return false;
        }

        let message = new client.Message('TAGMSG', target);
        message.tags['+draft/react'] = emoji;
        message.tags['+draft/reply'] = msgid;
        client.raw(message);

        return true;
    };
}
