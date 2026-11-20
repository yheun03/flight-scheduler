<template>
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
    >
        <path :d="paths[name] || paths.plane" />
    </svg>
</template>
<script setup>
defineProps({ name: { type: String, default: 'plane' } });
const paths = {
    plane: 'm3 11 7-2 2-6h2l1 6 6 3v2l-7-1-1 7h-2l-1-7-7 1z',
    grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    calendar:
        'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z M7 3v4 M17 3v4 M3 11h18 M7 15h2 M15 15h2',
    undo: 'M8 4 3 9l5 5 M3 9h10a7 7 0 0 1 0 14',
    redo: 'm16 4 5 5-5 5 M21 9H11a7 7 0 0 0 0 14',
    save: 'M4 3h13l4 4v14H3V3z M7 3v6h10V3 M7 21v-8h10v8',
    folder: 'M3 7V4h7l3 3h8v13H3z M3 10h18',
    check: 'm5 12 4 4L19 6',
    warning: 'm12 3 10 18H2z M12 9v5 M12 17h.01',
    clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 7v5l3 2',
    box: 'm3 7 9-4 9 4v12l-9 3-9-3z M3 7l9 4 9-4 M12 11v11',
    chart: 'M4 20V10 M12 20V4 M20 20v-7',
    info: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 11v6 M12 7h.01',
    close: 'm6 6 12 12 M6 18 18 6',
    reset: 'M3 11a9 9 0 1 1 2 7 M3 4v7h7',
    flag: 'M5 22V3 M5 3h14l-3 5 3 5H5',
    settings: 'M4 7h16 M4 17h16 M8 4v6 M16 14v6',
    help: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M9 8a3 3 0 1 1 4 3c-1 1-1 2-1 3 M12 17h.01',
};
</script>
