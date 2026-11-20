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
                {{ destination }}
                <span>{{ block.outbound.to }}</span>
            </strong>
            <span v-if="invalid" class="flight-block__warning">! 오류</span>
            <span v-else class="flight-block__grip" aria-hidden="true">⠿</span>
        </span>
        <span class="flight-block__numbers">
            {{ block.outbound.number }} / {{ block.inbound.number }}
            <span v-if="dayOffset">+{{ dayOffset }}일</span>
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
            {{ block.outbound.departureDate.slice(5).replace('-', '.') }} {{ time(block.start) }} –
            {{ time(block.arrival) }}
            <span v-if="dayOffset">+{{ dayOffset }}일</span>
            <span>준비 {{ block.turnaroundMinutes }}분</span>
        </span>
    </button>
</template>
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
const time = (value) =>
    new Intl.DateTimeFormat('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
        timeZone: 'Asia/Seoul',
    }).format(value);
const dayOffset = computed(
    () =>
        Math.floor((props.block.arrival + 9 * 3600000) / 86400000) -
        Math.floor((props.block.start + 9 * 3600000) / 86400000),
);
const segments = computed(() => {
    const b = props.block;
    return [b.outEnd - b.start, b.inStart - b.outEnd, b.arrival - b.inStart, b.end - b.arrival];
});
const label = computed(
    () =>
        `${destination.value} ${props.block.outbound.to}, ${props.block.outbound.number} / ${props.block.inbound.number}, ${props.block.outbound.departureDate}, KST ${time(props.block.start)} 출발 ${time(props.block.arrival)} 귀환${dayOffset.value ? ` +${dayOffset.value}일` : ''}${props.invalid ? ', 오류 있음' : ''}. 선택 후 상세에서 기체를 배정하세요.`,
);
function startDrag(event) {
    event.dataTransfer.setData('text/plain', props.block.id);
    event.dataTransfer.effectAllowed = 'move';
    emit('drag-start', props.block.id);
}
</script>
