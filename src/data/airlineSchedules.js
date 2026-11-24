import { getNetworkSchedules } from './weeklyNetwork';
import airSeoulCsv from './airseoul-weekly-schedules.csv?raw';
import parataCsv from './parata-weekly-schedules.csv?raw';
import airPremiaCsv from './airpremia-weekly-schedules.csv?raw';

import airBusanCsv from './airbusan-weekly-schedules.csv?raw';

import jinairCsv from './jinair-weekly-schedules.csv?raw';
import asianaCsv from './asiana-weekly-schedules.csv?raw';
import koreanairCsv from './koreanair-weekly-schedules.csv?raw';

function parseCsv(csv) {
    const [header, ...lines] = csv.trim().split('\n');
    const keys = header.split(',');
    return lines.map((line) => {
        const schedule = Object.fromEntries(line.split(',').map((value, index) => [keys[index], value]));
        schedule.weekly_frequency = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].reduce(
            (count, day) => count + Number(schedule[day] || 0),
            0,
        );
        return schedule;
    });
}

export const airlineSchedules = [
    {
        id: 'airbusan',
        code: 'BX',
        logo: `${import.meta.env.BASE_URL}airline-logos/ABL.png`,
        name: '에어부산',
        theme: 'sky',
        schedules: parseCsv(airBusanCsv),
    },
    {
        id: 'airseoul',
        code: 'RS',
        name: '에어서울',
        logo: `${import.meta.env.BASE_URL}airline-logos/air-seoul.svg`,
        theme: 'mint',
        schedules: parseCsv(airSeoulCsv),
    },
    {
        id: 'parata',
        code: 'WE',
        name: '파라타항공',
        logo: `${import.meta.env.BASE_URL}airline-logos/parata-air.svg`,
        theme: 'sky',
        schedules: parseCsv(parataCsv),
    },
    {
        id: 'airpremia',
        code: 'YP',
        name: '에어프레미아',
        logo: `${import.meta.env.BASE_URL}airline-logos/air-premia.svg`,
        theme: 'sunrise',
        schedules: parseCsv(airPremiaCsv),
    },
    {
        id: 'jinair', code: 'LJ', name: '진에어', theme: 'sky',
        logo: `${import.meta.env.BASE_URL}airline-logos/JNA.png`,
        schedules: parseCsv(jinairCsv),
    },
    {
        id: 'asiana', code: 'OZ', name: '아시아나항공', theme: 'sky',
        logo: `${import.meta.env.BASE_URL}airline-logos/AAR.png`,
        schedules: parseCsv(asianaCsv),
    },
    {
        id: 'koreanair', code: 'KE', name: '대한항공', theme: 'sky',
        logo: `${import.meta.env.BASE_URL}airline-logos/KAL.png`,
        schedules: parseCsv(koreanairCsv),
    },
].map((airline) => ({ ...airline, networkSchedules: getNetworkSchedules(airline.code) }));
