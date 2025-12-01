<template>
    <img
        :src="imgSrc"
        :alt="emoji"
        :title="title"
        class="kiwi-twemoji"
        draggable="false"
    >
</template>

<script>
'kiwi public';

// Import all twemoji SVGs
import thumbsUp from '@/res/twemoji/1f44d.svg';
import thumbsDown from '@/res/twemoji/1f44e.svg';
import heart from '@/res/twemoji/2764.svg';
import fire from '@/res/twemoji/1f525.svg';
import joy from '@/res/twemoji/1f602.svg';
import sob from '@/res/twemoji/1f62d.svg';
import facepalm from '@/res/twemoji/1f926.svg';
import shrug from '@/res/twemoji/1f937.svg';
import smilingImp from '@/res/twemoji/1f608.svg';
import angryImp from '@/res/twemoji/1f47f.svg';

const TWEMOJI_MAP = {
    '1f44d': thumbsUp,
    '1f44e': thumbsDown,
    '2764': heart,
    '1f525': fire,
    '1f602': joy,
    '1f62d': sob,
    '1f926': facepalm,
    '1f937': shrug,
    '1f608': smilingImp,
    '1f47f': angryImp,
};

export default {
    props: {
        twemoji: {
            type: String,
            required: true,
        },
        emoji: {
            type: String,
            default: '',
        },
        title: {
            type: String,
            default: '',
        },
    },
    computed: {
        imgSrc() {
            return TWEMOJI_MAP[this.twemoji] || '';
        },
    },
};
</script>

<style lang="less">
.kiwi-twemoji {
    height: 1.2em;
    width: 1.2em;
    vertical-align: middle;
    user-select: none;
}
</style>
