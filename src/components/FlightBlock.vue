<template>
    <button
        type="button"
        class="flight-block"
        :class="[
            `flight-block--${block.outbound.to.toLowerCase()}`,
            {
                'flight-block--selected': selected,
                'flight-block--error': invalid,
                'flight-block--compact': compact,
            },
        ]"
        draggable="true"
        :aria-pressed="selected"
        :aria-label="label"
        :title="label"
        @click="$emit('select', block.id)"
        @dragstart="startDrag"
        @dragend="$emit('drag-end')"
    >
        <span class="flight-block__heading">
            <strong>
                <template v-if="compact"><span class="flight-block__compact-number">{{ block.outbound.number }} </span>{{ block.outbound.to }}</template>
                <template v-else>
                    {{ destination }}
                    <span>{{ block.outbound.to }}</span>
                </template>
            </strong>
            <span v-if="invalid" class="flight-block__warning">{{ compact ? '!' : '! 오류' }}</span>
            <span v-else class="flight-block__grip" aria-hidden="true">⠿</span>
        </span>
        <span v-if="!compact" class="flight-block__numbers">
            <span>{{ block.outbound.number }}{{ block.single ? '' : ' / ' + block.inbound.number }}</span>
        </span>
        <span v-if="!compact" class="flight-block__route">
            {{ block.outbound.from }} → {{ block.outbound.to }}{{ block.single ? '' : ' → ' + block.inbound.to }}
        </span>
        <span class="flight-block__segments" aria-hidden="true">
            <span
                v-for="(part, i) in segments"
                :key="i"
                :class="`flight-block__segment flight-block__segment--${i}`"
                :style="{ flexGrow: part }"
            ></span>
        </span>
        <span v-if="!compact" class="flight-block__time">
            <span><small>출발</small> {{ weekdayShort }} {{ block.outbound.departureLocal }}</span>
            <span>
                <small>도착</small> {{ arrivalWeekday }} {{ time(block.arrival) }}
                <em v-if="dayOffset">+{{ dayOffset }}일</em>
            </span>
        </span>
        <span v-if="!compact" class="flight-block__ready">도착 후 준비 {{ block.turnaroundMinutes }}분</span>
    </button>
</template>
<script>
const formatTime = new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Seoul' });
const formatWeekday = new Intl.DateTimeFormat('ko-KR', { weekday: 'short', timeZone: 'Asia/Seoul' });
</script>
<script setup>
import { computed } from 'vue';
import { airports } from '../data/schedules';
const props = defineProps({
    block: { type: Object, required: true },
    selected: Boolean,
    invalid: Boolean,
    compact: Boolean,
});
const emit = defineEmits(['select', 'drag-start', 'drag-end']);
const destination = computed(() => airports[props.block.outbound.to].name);
const time = (value) => formatTime.format(value);
const dayOffset = computed(
    () =>
        Math.floor((props.block.arrival + 9 * 3600000) / 86400000) -
        Math.floor((props.block.start + 9 * 3600000) / 86400000),
);
const weekdayShort = computed(() => props.block.outbound.weekday.replace('요일', ''));
const arrivalWeekday = computed(() => formatWeekday.format(props.block.arrival).replace('요일', ''));
const segments = computed(() => {
    const b = props.block;
    return [b.outEnd - b.start, b.inStart - b.outEnd, b.arrival - b.inStart, b.end - b.arrival];
});
const label = computed(
    () =>
        `${destination.value} ${props.block.outbound.to}. 편명 ${props.block.outbound.number}${props.block.single ? '' : ', 복편 ' + props.block.inbound.number}. ${props.block.outbound.weekday}요일 ${props.block.outbound.departureLocal} 출발, ${time(props.block.arrival)} 도착${dayOffset.value ? ` +${dayOffset.value}일` : ''}${props.invalid ? ', 오류 있음' : ''}.`,
);
function startDrag(event) {
    event.dataTransfer.setData('text/plain', props.block.id);
    event.dataTransfer.effectAllowed = 'move';
    emit('drag-start', props.block.id);
}
</script>
