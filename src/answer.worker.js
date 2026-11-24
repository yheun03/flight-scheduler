import { solveSchedule } from './game.js';

self.onmessage = ({ data }) => {
    try {
        self.postMessage({ plan: solveSchedule(data.dataset, data.current) });
    } catch (error) {
        self.postMessage({ error: error.message });
    }
};
