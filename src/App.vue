<template>
    <div class="scheduler">
        <aside class="sidebar" aria-label="앱 메뉴">
            <a class="sidebar__brand" href="#main" aria-label="Flight Scheduler 메인" @click="currentPage = 'scheduler'">
                <AppIcon name="plane" />
            </a>
            <span class="sidebar__divider"></span>
            <button
                class="sidebar__item"
                :class="{ 'sidebar__item--active': currentPage === 'scheduler' }"
                aria-label="운항 스케줄"
                title="운항 스케줄"
                @click="scrollTimeline"
            >
                <AppIcon name="calendar" />
            </button>
            <button
                class="sidebar__item"
                :class="{ 'sidebar__item--active': currentPage === 'flights' }"
                aria-label="항공사별 운항 편명"
                title="항공사별 운항 편명"
                @click="currentPage = 'flights'"
            >
                <AppIcon name="grid" />
            </button>
            <button
                class="sidebar__item"
                aria-label="시나리오와 난이도"
                title="시나리오와 난이도"
                @click="openDialog('levels')"
            >
                <AppIcon name="settings" />
            </button>
            <button class="sidebar__item" aria-label="운영 결과" title="운영 결과" @click="showResults">
                <AppIcon name="chart" />
            </button>
            <button
                class="sidebar__item"
                aria-label="데이터 출처"
                title="데이터 출처"
                @click="openDialog('sources')"
            >
                <AppIcon name="folder" />
            </button>
            <button
                class="sidebar__item sidebar__item--bottom"
                aria-label="게임 도움말"
                title="게임 도움말"
                @click="openDialog('help')"
            >
                <AppIcon name="help" />
            </button>
            <span class="sidebar__avatar" title="로컬 플레이어">FS</span>
        </aside>

        <div class="scheduler__body">
            <header class="topbar">
                <a href="#main" class="topbar__wordmark">
                    FLIGHT
                    <span>SCHEDULER</span>
                </a>
                <span class="topbar__separator">/</span>
                <span class="topbar__section">
                    {{ currentPage === 'scheduler' ? '운항 계획실' : '항공사별 운항 편명' }}
                </span>
                <div class="topbar__right">
                    <span class="topbar__local">브라우저 로컬 플레이</span>
                    <button class="button button--quiet" @click="openDialog('help')">
                        <AppIcon name="help" />
                        플레이 가이드
                    </button>
                </div>
            </header>
            <main v-if="currentPage === 'scheduler'" id="main" class="workspace">
                <div class="page-heading">
                    <div>
                        <div class="eyebrow">{{ dataset.airlineCode }} ROTATION SIMULATOR</div>
                        <h1>
                            {{ dataset.airlineName }} 로테이션 시뮬레이터
                            <span class="page-heading__plane">✈</span>
                        </h1>
                        <p>
                            7일 반복 시간표를 {{ dataset.aircraft.length }}대의 가상 항공기에 배정하세요.
                            타임라인은 한국 시각, 운항 카드의 출발은 현지 시각입니다.
                        </p>
                    </div>
                    <button class="scenario-pill" @click="openDialog('levels')">
                        <span class="scenario-pill__logo">
                            <img
                                v-if="scenarioAirline?.logo"
                                :src="scenarioAirline.logo"
                                :alt="`${dataset.airlineName} 로고`"
                            />
                            <template v-else>{{ dataset.airlineCode }}</template>
                        </span>
                        <span>
                            <strong>{{ dataset.airlineName }}</strong>
                            <small>{{ dataset.difficulty }} / 배정 기체 {{ dataset.aircraft.length }}대</small>
                        </span>
                        <AppIcon name="settings" />
                    </button>
                </div>

                <div class="scenario-bar">
                    <span class="badge">
                        {{
                            dataset.kind === 'partial'
                                ? '부분 시간표'
                                : dataset.kind === 'weekly'
                                  ? '주간 시간표'
                                  : '가상 시간표'
                        }}
                    </span>
                    <label class="scenario-bar__select">
                        시나리오
                        <select
                            :value="dataset.id"
                            aria-label="시간표 데이터셋"
                            @change="changeDataset($event.target.value)"
                        >
                            <option v-for="d in datasets" :key="d.id" :value="d.id">{{ d.name }}</option>
                        </select>
                    </label>
                    <span class="scenario-bar__note">
                        {{
                            dataset.description ||
                            (dataset.kind === 'partial'
                                ? '2026.11.20 기준 일부 노선을 요일·현지 시각으로 구성했습니다.'
                                : 'FS 편명과 모든 시각은 게임용 창작 데이터입니다.')
                        }}
                    </span>
                    <span v-if="dataset.pending?.length">시각 확인 대기 {{ dataset.pending.length }}편</span>
                    <button class="text-button" @click="openDialog('sources')">출처와 검증 범위</button>
                </div>

                <button v-if="answerShown && dataset.pending?.length" class="button" @click="openPending">
                    정답 배정에서 시각 확인 대기 중인 {{ dataset.pending.length }}편 보기
                </button>
                <section class="metrics" aria-label="운영 요약">
                    <article class="metric">
                        <div class="metric__icon"><AppIcon name="check" /></div>
                        <div>
                            <span class="metric__label">배정 운항편</span>
                            <strong>
                                {{ result.completed }}
                                <small>/ {{ result.total }}편</small>
                            </strong>
                        </div>
                        <span class="metric__note">{{ result.total - result.completed }}편 배정 대기</span>
                    </article>
                    <article class="metric">
                        <div class="metric__icon" :class="{ 'metric__icon--error': conflicts.length }">
                            <AppIcon name="warning" />
                        </div>
                        <div>
                            <span class="metric__label">운영 충돌</span>
                            <strong :class="{ 'text-error': conflicts.length }">
                                {{ conflicts.length }}
                                <small>건</small>
                            </strong>
                        </div>
                        <span class="metric__note">
                            {{ conflicts.length ? '배정 확인 필요' : '충돌 없는 운영' }}
                        </span>
                    </article>
                    <article class="metric">
                        <div class="metric__icon"><AppIcon name="plane" /></div>
                        <div>
                            <span class="metric__label">사용 기체</span>
                            <strong>
                                {{ result.used }}
                                <small>/ {{ dataset.aircraft.length }}대</small>
                            </strong>
                        </div>
                        <span class="metric__note">
                            가상 식별자 {{ dataset.aircraft[0].id }}–{{ dataset.aircraft.at(-1).id }}
                        </span>
                    </article>
                    <article class="metric metric--score">
                        <div class="metric__icon"><AppIcon name="chart" /></div>
                        <div>
                            <span class="metric__label">운영 점수</span>
                            <strong>
                                {{ result.score }}
                                <small>/ 100</small>
                            </strong>
                        </div>
                        <span class="metric__note">클리어 목표 80점</span>
                    </article>
                </section>

                <section ref="timelineSection" class="panel timeline-panel" aria-labelledby="timeline-title">
                    <div class="timeline-toolbar">
                        <div>
                            <div class="section-kicker">FLEET TIMELINE</div>
                            <h2 id="timeline-title">
                                주간 운항 스케줄
                                <span class="week-label">요일 · 시각 기준</span>
                            </h2>
                        </div>
                        <div
                            class="timeline-status"
                            :class="{
                                'timeline-status--complete': !unassigned.length && !conflicts.length,
                                'timeline-status--warning': unassigned.length || conflicts.length,
                            }"
                        >
                            <span class="timeline-status__dot"></span>
                            <span>
                                <strong>
                                    {{
                                        !unassigned.length && !conflicts.length
                                            ? '운항 준비 완료'
                                            : '스케줄 조정 필요'
                                    }}
                                </strong>
                                <small>미배정 {{ unassigned.length }}편 · 오류 {{ conflicts.length }}건</small>
                            </span>
                        </div>
                    </div>
                    <div class="actionbar">
                        <div class="actionbar__group">
                            <button class="button" :disabled="!undoStack.length" @click="undo">
                                <AppIcon name="undo" />
                                되돌리기
                            </button>
                            <button class="button" :disabled="!redoStack.length" @click="redo">
                                <AppIcon name="redo" />
                                다시 실행
                            </button>
                            <span class="actionbar__divider"></span>
                            <button
                                class="button button--quiet"
                                :disabled="!assignments.length"
                                @click="commit([])"
                            >
                                <AppIcon name="reset" />
                                전체 배정 해제
                            </button>
                        </div>
                        <div class="actionbar__group">
                            <button class="button" @click="save">
                                <AppIcon name="save" />
                                로컬 저장
                            </button>
                            <button class="button" @click="load">
                                <AppIcon name="folder" />
                                로컬 불러오기
                            </button>
                            <button class="button" @click="saveCsv">
                                <AppIcon name="save" />
                                CSV 저장
                            </button>
                            <button class="button" @click="csvInput?.click()">
                                <AppIcon name="folder" />
                                CSV 불러오기
                            </button>
                            <input
                                ref="csvInput"
                                class="sr-only"
                                type="file"
                                accept=".csv,text/csv"
                                @change="loadCsv"
                            />
                            <button v-if="dataset.pending" class="button" @click="openFerry">페리 비행 추가</button>
                            <button v-if="dataset.kind !== 'fiction'" class="button" :disabled="answerBusy" @click="showAnswer">
                                <AppIcon name="grid" />
                                {{ answerBusy ? '배정안 비교 중' : '정답 보기' }}
                            </button>
                            <button class="button button--primary" @click="showResults">
                                <AppIcon name="check" />
                                운항 검증
                            </button>
                        </div>
                    </div>
                    <div class="timeline-hint">
                        <span>
                            <AppIcon name="info" />
                            블록을 기체 행으로 드래그하거나, 선택 후 상세에서 배정하세요. 출발 시각은
                            고정됩니다.
                        </span>
                        <span class="timezone-label">기준 시간 KST (UTC+9)</span>
                    </div>
                    <div v-if="selected && assignedPlane(selected.id)" class="timeline-selection">
                        <div>
                            <strong>{{ selected.outbound.to }}</strong>
                            <span>{{ airports[selected.outbound.to].name }}</span>
                        </div>
                        <span>
                            <small>편명</small>
                            {{ selected.outbound.number }}{{ selected.single ? '' : ' / ' + selected.inbound.number }}
                        </span>
                        <span>
                            <small>출발</small>
                            {{ selected.outbound.weekday }} {{ selected.outbound.departureLocal }}
                        </span>
                        <span>
                            <small>도착</small>
                            {{ formatTime(selected.arrival) }}
                        </span>
                        <span>
                            <small>배정 기체</small>
                            {{ assignedPlane(selected.id) }}
                        </span>
                    </div>
                    <div
                        ref="timelineScroll"
                        class="timeline-scroll"
                        tabindex="0"
                        aria-label="항공기 주간 운항 타임라인"
                    >
                        <div
                            class="timeline"
                        >
                            <div class="timeline__header">
                                <div class="timeline__corner">
                                    항공기
                                    <small>가상 기체 / 배정 현황</small>
                                </div>
                                <div class="timeline__dates">
                                    <div
                                        v-for="day in days"
                                        :key="day.index"
                                        class="timeline__date"
                                        :class="{ 'timeline__date--weekend': day.index > 4 }"
                                    >
                                        <span>
                                            {{ day.label }}
                                            <small
                                                v-if="
                                                    dataset.kind === 'partial' && ![4, 5].includes(day.index)
                                                "
                                            >
                                                자료 미확보
                                            </small>
                                        </span>
                                        <div class="timeline__hours">
                                            <span v-for="hour in ['00', '06', '12', '18']" :key="hour">
                                                {{ hour }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div
                                v-for="plane in dataset.aircraft"
                                :key="plane.id"
                                class="timeline__row"
                                :class="{
                                    'timeline__row--drop': dragOver === plane.id,
                                    'timeline__row--selected':
                                        selectedId && assignedPlane(selectedId) === plane.id,
                                }"
                                :style="{ minHeight: rowHeight(plane.id) + 'px' }"
                                @dragover.prevent="dragOver = plane.id"
                                @dragleave="dragOver = null"
                                @drop.prevent="drop($event, plane.id)"
                            >
                                <div class="timeline__aircraft">
                                    <span class="timeline__aircraft-icon"><AppIcon name="plane" /></span>
                                    <div>
                                        <strong>{{ plane.id }}</strong>
                                        <small v-if="plane.model || dataset.airlineCode === 'RS' || dataset.airlineCode === 'YP'">{{ plane.model || (dataset.airlineCode === 'RS' ? 'A321-200' : 'B787-9') }}</small>
                                        <small>
                                            <span>{{ loadFor(plane.id).count }}개 운항</span>
                                        </small>
                                    </div>
                                    <span
                                        v-if="issuesForPlane(plane.id)"
                                        class="timeline__error"
                                        title="검증 오류 있음"
                                    >
                                        !
                                    </span>
                                </div>
                                <div class="timeline__track">
                                    <span
                                        v-for="m in visibleMaintenance(plane.id)"
                                        :key="m.id"
                                        class="maintenance-block"
                                        :style="position(m)"
                                        :title="`필수 게임 정비 ${formatDate(m.start)} ~ ${formatDate(m.end)}`"
                                    >
                                        정비
                                    </span>
                                    <span v-for="f in ferryOptions.filter((item) => item.active && item.aircraftId === plane.id)"
                                        :key="f.id" class="maintenance-block" :style="position(f)"
                                        :title="f.from + ' → ' + f.to + ' 계획 페리 ' + f.minutes + '분 / ' + number(ferryCost(dataset, f.minutes)) + ' 크레딧'">페리</span>
                                    <FlightBlock
                                        v-for="block in planeBlocks(plane.id)"
                                        :key="block.id"
                                        :block="block"
                                        :data-rotation-id="block.id"
                                        compact
                                        :selected="selectedId === block.id"
                                        :invalid="hasIssue(block.id)"
                                        :style="{
                                            ...position(block),
                                            top: 7 + laneFor(block.id, plane.id) * 38 + 'px',
                                        }"
                                        @select="selectBlock"
                                        @drag-start="dragId = $event"
                                        @drag-end="endDrag"
                                    />
                                    <span
                                        v-if="
                                            !planeBlocks(plane.id).length &&
                                            !visibleMaintenance(plane.id).length
                                        "
                                        class="timeline__empty"
                                    >
                                        {{ dragId ? '여기에 운항편 배정' : '배정 가능한 시간' }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="timeline-footer">
                        <div class="legend">
                            <span>
                                <i class="legend__flight"></i>
                                비행 구간
                            </span>
                            <span>
                                <i class="legend__wait"></i>
                                현지 대기
                            </span>
                            <span>
                                <i class="legend__ready"></i>
                                도착 후 준비
                            </span>
                            <span v-if="dataset.maintenance.length">
                                <i class="legend__maintenance"></i>
                                필수 정비
                            </span>
                            <span>
                                <i class="legend__error">!</i>
                                운영 오류
                            </span>
                        </div>
                        <label v-if="dataset.kind === 'fiction'" class="repeat-toggle">
                            <input v-model="repeat" type="checkbox" @change="persistSession" />
                            주간 반복 검사
                        </label>
                        <span v-else class="timeline-footer__note">
                            빈 날짜는 미운항을 의미하지 않습니다.
                        </span>
                    </div>
                </section>

                <button class="button button--primary rotation-picker__trigger" aria-haspopup="dialog" @click="openPicker">
                    <AppIcon name="box" /> 운항 카드 선택
                </button>
                <dialog ref="picker" @close="pickerVisible = false" class="rotation-picker" :class="{ 'rotation-picker--dragging': pickerDragging }" aria-labelledby="picker-title" @click.self="picker.close()">
                    <div class="rotation-picker__body">
                        <header class="panel-heading">
                            <h2 id="picker-title">운항 카드 선택</h2>
                            <button class="button" @click="picker.close()">닫기</button>
                        </header>
                        <p class="rotation-picker__hint">운항 카드를 타임라인의 기체 행으로 끌어 배정하세요.</p>
                        <div class="rotation-picker__filters">
                            <input v-model.trim="pickerQuery" type="search" placeholder="편명, 공항 또는 배정 기체 검색" aria-label="운항 카드 검색" autofocus />
                            <select v-model="pickerStatus" aria-label="배정 상태">
                                <option value="pending">미배정</option>
                                <option value="assigned">배정 완료</option>
                                <option value="all">전체</option>
                            </select>
                        </div>
                        <div class="rotation-picker__list">
                            <details ref="pendingList" v-if="dataset.pending?.length && pickerStatus !== 'assigned'">
                                <summary>예정 시각 확인 대기 {{ dataset.pending.length }}편</summary>
                                <p v-for="f in pendingMatches" :key="f.id" class="rotation-picker__card">
                                    <strong>{{ f.number }}　{{ f.from }} → {{ f.to }}</strong>
                                    <small>{{ f.departureDate }}　{{ f.departureLocal || '출발 미확인' }} / {{ f.arrivalLocal || '도착 미확인' }}</small>
                                </p>
                            </details>
                            <button v-for="block in pickerBlocks" :key="block.id" class="rotation-picker__card" draggable="true"
                                @dragstart="startPickerDrag($event, block.id)" @dragend="endDrag"
                                :aria-pressed="selectedId === block.id" @click="selectBlock(block.id)">
                                <strong>{{ block.outbound.from }} → {{ block.outbound.to }}</strong>
                                <span>{{ block.outbound.weekday }} {{ block.outbound.departureLocal }}</span>
                                <small>{{ block.outbound.number }}{{ block.single ? '' : ' / ' + block.inbound.number }}</small>
                                <small>{{ assignedPlane(block.id) || '미배정' }}</small>
                            </button>
                            <p v-if="!pickerBlocks.length">조건에 맞는 운항 카드가 없습니다.</p>
                        </div>
                        <footer v-if="selected" class="rotation-picker__selection">
                            <strong>{{ selected.outbound.number }}{{ selected.single ? '' : ' / ' + selected.inbound.number }}</strong>
                            <span>{{ selected.outbound.weekday }} {{ selected.outbound.departureLocal }}　{{ selected.outbound.from }} → {{ selected.outbound.to }}</span>
                            <label>배정 기체
                                <select :value="assignedPlane(selected.id) || ''" @change="picker.close(); assign(selected.id, $event.target.value || null)">
                                    <option value="">미배정</option>
                                    <option v-for="plane in dataset.aircraft" :key="plane.id" :value="plane.id">{{ plane.id }} {{ plane.model }}</option>
                                </select>
                            </label>
                            <button v-if="selectedFerry" class="button" @click="toggleFerry(selectedFerry)">
                                {{ selectedFerry.from }} → {{ selectedFerry.to }} 계획 페리 {{ selectedFerry.active ? '제거' : '추가' }} ({{ selectedFerry.minutes }}분 / {{ number(ferryCost(dataset, selectedFerry.minutes)) }} 크레딧)
                            </button>
                        </footer>
                    </div>
                </dialog>
                <div class="workspace__lower">
                    <section
                        class="panel tray"
                        :class="{ 'tray--drop': dragOver === 'tray' }"
                        @dragover.prevent="dragOver = 'tray'"
                        @dragleave="dragOver = null"
                        @drop.prevent="drop($event, null)"
                        aria-labelledby="tray-title"
                    >
                        <div class="panel-heading">
                            <div>
                                <h2 id="tray-title">
                                    <AppIcon name="box" />
                                    미배정 운항편
                                    <span class="count-badge">{{ unassigned.length }}</span>
                                </h2>
                                <p>운항편을 확인하고 기체를 선택하면 주간 스케줄에 바로 등록됩니다.</p>
                            </div>
                            <label class="tray__filter">
                                <span class="sr-only">출발 공항 필터</span>
                                <select v-model="airportFilter">
                                    <option value="all">모든 출발 공항</option>
                                    <option value="ICN">인천 ICN</option>
                                    <option value="GMP">김포 GMP</option>
                                </select>
                            </label>
                        </div>
                        <ol class="tray__steps" aria-label="주간 스케줄 등록 순서">
                            <li><b>1</b> 운항 요일·시각 확인</li>
                            <li><b>2</b> 배정할 기체 선택</li>
                            <li><b>3</b> 타임라인 오류 확인</li>
                        </ol>
                        <div class="tray__grid">
                            <div
                                v-for="block in trayPageBlocks"
                                :key="block.id"
                                class="tray__item"
                            >
                                <FlightBlock
                                    :block="block"
                                    :selected="selectedId === block.id"
                                    @select="selectBlock"
                                    @drag-start="dragId = $event"
                                    @drag-end="endDrag"
                                />
                                <label class="tray__assign">
                                    <span>주간 스케줄에 등록</span>
                                    <select
                                        aria-label="배정할 기체 선택"
                                        @change="assign(block.id, $event.target.value || null)"
                                    >
                                        <option value="" selected disabled>기체 선택</option>
                                        <option
                                            v-for="plane in dataset.aircraft"
                                            :key="plane.id"
                                            :value="plane.id"
                                        >
                                            {{ plane.id }}
                                        </option>
                                    </select>
                                </label>
                            </div>
                            <div v-if="!filteredUnassigned.length" class="empty-state">
                                <AppIcon :name="unassigned.length ? 'box' : 'check'" />
                                <strong>
                                    {{
                                        unassigned.length
                                            ? '이 공항의 미배정편이 없습니다.'
                                            : '모든 운항편을 배정했습니다.'
                                    }}
                                </strong>
                                <span>배정된 블록을 이곳으로 옮기면 배정이 해제됩니다.</span>
                            </div>
                        </div>
                        <nav v-if="trayPageCount > 1" class="tray__pagination" aria-label="미배정 카드 페이지">
                            <button class="button" :disabled="trayPage === 1" @click="trayPage--">이전</button>
                            <span>{{ trayPage }} / {{ trayPageCount }}</span>
                            <button class="button" :disabled="trayPage === trayPageCount" @click="trayPage++">다음</button>
                        </nav>
                    </section>
                    <section class="panel detail" aria-labelledby="detail-title">
                        <div class="panel-heading">
                            <h2 id="detail-title">운항편 상세</h2>
                            <span class="badge badge--neutral">예정 시각 고정</span>
                        </div>
                        <template v-if="selected">
                            <div class="detail__route">
                                <span>
                                    <small>{{ airports[selected.outbound.from].name }}</small>
                                    {{ selected.outbound.from }}
                                </span>
                                <div>
                                    <AppIcon name="plane" />
                                    <small>ROUND TRIP</small>
                                </div>
                                <span>
                                    <small>{{ airports[selected.outbound.to].name }}</small>
                                    {{ selected.outbound.to }}
                                </span>
                            </div>
                            <div class="detail__legs">
                                <div
                                    v-for="(flight, i) in (selected.single ? [selected.outbound] : [selected.outbound, selected.inbound])"
                                    :key="flight.id"
                                >
                                    <span class="detail__leg-number">
                                        {{ selected.single ? '편도' : i ? '복편' : '왕편' }}
                                        <strong>{{ flight.number }}</strong>
                                    </span>
                                    <strong>
                                        {{ flight.departureLocal }} — {{ flight.arrivalLocal }}
                                        <small v-if="flight.arrivalDate !== selected.outbound.departureDate">
                                            +{{
                                                Math.round(
                                                    (Date.parse(flight.arrivalDate) -
                                                        Date.parse(selected.outbound.departureDate)) /
                                                        86400000,
                                                )
                                            }}일
                                        </small>
                                    </strong>
                                    <span>
                                        {{ flight.from }} → {{ flight.to }} / {{ flight.weekday }}요일
                                    </span>
                                    <small>
                                        현지 {{ flight.departureTimeZone }} / {{ flight.arrivalTimeZone }}
                                    </small>
                                    <small>
                                        KST {{ formatTime(Date.parse(flight.scheduledDeparture)) }} →
                                        {{ formatTime(Date.parse(flight.scheduledArrival)) }}
                                    </small>
                                </div>
                            </div>
                            <div class="detail__facts">
                                <span>
                                    순수 비행
                                    <strong>{{ selected.hours.toFixed(2) }}시간</strong>
                                </span>
                                <span v-if="!selected.single">
                                    현지 대기
                                    <strong>
                                        {{ Math.round((selected.inStart - selected.outEnd) / MINUTE) }}분
                                    </strong>
                                </span>
                                <span>
                                    도착 후 준비
                                    <strong>{{ selected.turnaroundMinutes }}분</strong>
                                </span>
                                <span>
                                    사이클
                                    <strong>{{ selected.cycles }}회</strong>
                                </span>
                            </div>
                            <label class="detail__assign">
                                배정 기체
                                <select
                                    :value="assignedPlane(selected.id)"
                                    aria-label="선택한 운항편 배정 기체"
                                    @change="assign(selected.id, $event.target.value || null)"
                                >
                                    <option value="">미배정 보관함</option>
                                    <option
                                        v-for="plane in dataset.aircraft"
                                        :key="plane.id"
                                        :value="plane.id"
                                    >
                                        {{ plane.id }}
                                    </option>
                                </select>
                            </label>
                            <p class="detail__source">
                                {{
                                    dataset.kind === 'fiction'
                                        ? '가상 연습용 시간표'
                                        : '11월 16일~22일 / ' + selected.outbound.sourceId
                                }}
                                <br />
                                준비 시간, 정비와 기체 수는 게임 설정입니다.
                            </p>
                            <button
                                class="text-button"
                                :disabled="!assignedPlane(selected.id)"
                                @click="focusSelectedBlock"
                            >
                                타임라인에서 배정 위치 보기
                            </button>
                        </template>
                        <div v-else class="empty-state">
                            <AppIcon name="plane" />
                            <strong>운항편을 선택하세요.</strong>
                            <span>타임라인과 보관함에서 상세를 볼 수 있습니다.</span>
                        </div>
                    </section>
                    <section class="panel validation" aria-labelledby="validation-title">
                        <div class="panel-heading">
                            <div>
                                <h2 id="validation-title">
                                    <AppIcon name="flag" />
                                    운항 체크리스트
                                    <span class="count-badge">{{ result.issues.length }}</span>
                                </h2>
                                <p>필수편 전체 배정, 검증 오류 0건, 80점 이상이면 클리어</p>
                            </div>
                            <button class="text-button" @click="showResults">결과 확인</button>
                        </div>
                        <ul v-if="result.issues.length" class="issue-list">
                            <li v-for="(issue, i) in result.issues" :key="`${issue.code}-${i}`">
                                <AppIcon :name="issue.code === 'unassigned' ? 'box' : 'warning'" />
                                <button
                                    v-if="issue.blockId"
                                    @click="
                                        selectBlock(issue.blockId);
                                        focusSelectedBlock();
                                    "
                                >
                                    {{ issue.message }}
                                </button>
                                <span v-else>{{ issue.message }}</span>
                                <span class="issue-list__tag">
                                    {{ issue.code === 'unassigned' ? '배정 대기' : '수정 필요' }}
                                </span>
                            </li>
                        </ul>
                        <div v-else class="validation__success">
                            <AppIcon name="check" />
                            모든 필수 검사를 통과했습니다. 운영 결과를 확인하세요.
                        </div>
                    </section>
                </div>
                <footer class="workspace-footer">
                    <span>
                        FLIGHT SCHEDULER
                        <span>항공사 운영 퍼즐</span>
                    </span>
                    <span>실제 등록번호와 실제 기체 배정을 사용하지 않습니다.</span>
                    <button class="text-button" @click="newPlay">새 플레이 시작</button>
                </footer>
                <div v-if="notice" class="notice" role="status">
                    <AppIcon name="info" />
                    {{ notice }}
                    <button aria-label="안내 닫기" @click="notice = ''"><AppIcon name="close" /></button>
                </div>
                <div v-if="storageError" class="storage-error" role="alert">
                    <span>{{ storageError }}</span>
                    <button class="button" @click="clearSave">저장 데이터 초기화</button>
                    <button class="button" @click="storageError = ''">닫기</button>
                </div>
            </main>
            <main
                v-else
                id="main"
                class="workspace flight-catalog"
                :class="`flight-catalog--${selectedAirline.theme}`"
            >
                <div class="page-heading">
                    <div>
                        <div class="eyebrow">FLIGHT NUMBER CATALOG</div>
                        <h1>항공사별 주간 운항 노선</h1>
                        <p>11월 정규 노선과 11월 16일~22일의 편명별 운항 요일을 확인하세요.</p>
                    </div>
                    <span class="badge">11월 22일 기준</span>
                </div>
                <div class="flight-catalog__toolbar">
                    <div class="flight-catalog__airlines" role="tablist" aria-label="항공사 선택">
                        <button
                            v-for="airline in airlineSchedules"
                            :key="airline.id"
                            class="button"
                            :class="{ 'button--primary': selectedAirlineId === airline.id }"
                            @click="selectedAirlineId = airline.id; departureGroupFilter = 'all'"
                        >
                            <span class="flight-catalog__logo">
                                <img v-if="airline.logo" :src="airline.logo" alt="" />
                                <template v-else>{{ airline.code }}</template>
                            </span>
                            <span>
                                {{ airline.name }}
                                <small>{{ airline.code }}</small>
                            </span>
                        </button>
                    </div>
                    <label>
                        <span class="sr-only">출발 공항</span>
                        <select v-model="departureGroupFilter">
                            <option value="all">모든 출발 공항</option>
                            <option v-for="[code, name] in originOptions" :key="code" :value="code">
                                {{ name }} ({{ code }})
                            </option>
                        </select>
                    </label>
                </div>
                <section class="panel flight-catalog__panel">
                    <div class="panel-heading">
                        <div>
                            <h2>{{ selectedAirline.name }} 정규 노선</h2>
                            <p>편도 {{ visibleRoutes.length }}개 노선 / 노선을 열면 편명별 운항 요일과 현지 예정 시각을 볼 수 있습니다.</p>
                        </div>
                    </div>
                    <details v-for="route in visibleRoutes" :key="selectedAirline.code + route.key" class="flight-catalog__route">
                        <summary>
                            <strong>{{ route.origin }} ({{ route.from }}) → {{ route.destination }} ({{ route.to }})</strong>
                            <span>{{ route.pattern }}</span>
                        </summary>
                        <div v-if="route.flights.length" class="flight-catalog__table-wrap">
                            <table class="flight-catalog__table">
                                <thead><tr><th>편명</th><th>11월 16일~22일 운항 요일</th><th>현지 예정 시각</th></tr></thead>
                                <tbody>
                                    <tr v-for="flight in route.flights" :key="[flight.flight_number, flight.departure_time_local, flight.days].join('-')">
                                        <td><strong>{{ flight.flight_number }}</strong></td>
                                        <td>{{ flight.complete === false ? '확인 요일 ' + [...flight.days].join(', ') : dayLabel(flight.days) }}</td>
                                        <td>{{ flight.departure_time_local || '미확인' }} → {{ flight.arrival_time_local || '미확인' }}{{ flight.arrivalOffset ? ' (' + (flight.arrivalOffset > 0 ? '+' : '') + flight.arrivalOffset + '일)' : '' }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p v-else>11월 취항 목록에 있는 노선입니다. 기준 주간 편명과 시간은 미확인입니다.</p>
                    </details>
                </section>
            </main>
        </div>
        <dialog ref="ferryDialog" class="modal ferry-planner" aria-labelledby="ferry-heading">
            <header class="modal__header"><h2 id="ferry-heading">페리 비행 추가</h2><button class="button" @click="ferryDialog.close()">닫기</button></header>
            <div class="ferry-planner__form">
                <label>이동할 기체<select v-model="ferryPlane" @change="resetFerryOrigin">
                    <option v-for="plane in dataset.aircraft" :key="plane.id" :value="plane.id">{{ plane.id }} {{ plane.model }}</option>
                </select></label>
                <label>이동 전 위치<select v-model="ferryAnchor" @change="resetFerryDestination">
                    <option value="">주간 시작 위치 ({{ ferryBase }})</option>
                    <option v-for="leg in ferryLegs" :key="leg.id" :value="leg.id">{{ leg.outbound.number }} 도착 후 / {{ leg.inbound.to }} / {{ formatDate(leg.arrival) }}</option>
                </select></label>
                <label>이동할 공항<select v-model="ferryTo">
                    <option value="" disabled>공항 선택</option>
                    <option v-for="code in ferryAirports.filter((code) => code !== ferryOrigin)" :key="code" :value="code">{{ airports[code].name }} ({{ code }})</option>
                </select></label>
                <template v-if="ferryPreview">
                    <strong>{{ ferryOrigin }} → {{ ferryTo }} / 예상 {{ ferryPreview.minutes }}분</strong>
                    <span>출발 {{ formatDate(ferryPreview.start) }} → 도착 {{ formatDate(ferryPreview.arrival) }} (KST)</span>
                    <span>다음 운항 가능 {{ formatDate(ferryPreview.end) }} / 예상 비용 {{ number(ferryCost(dataset, ferryPreview.minutes)) }} 크레딧</span>
                    <small>게임 기준 연료비와 시간별 정비 적립금, 이착륙 1회 적립금을 합산합니다.</small>
                </template>
                <p v-if="ferryWarning" role="status">{{ ferryWarning }}</p>
                <button class="button button--primary" :disabled="!ferryPreview || !!ferryWarning" @click="addManualFerry">타임라인에 추가</button>
                <div v-for="f in ferryOptions.filter((item) => item.manual && item.aircraftId === ferryPlane)" :key="f.id">
                    {{ f.from }} → {{ f.to }} / {{ formatDate(f.start) }}
                    <button class="button" @click="commit(assignments.filter((a) => a.rotationId !== f.id))">삭제</button>
                </div>
            </div>
        </dialog>
        <dialog ref="dialog" class="modal" @click="closeOnBackdrop">
            <div class="modal__header">
                <div>
                    <div class="section-kicker">FLIGHT SCHEDULER</div>
                    <h2>
                        {{
                            {
                                results: '운영 결과 리포트',
                                sources: '데이터 출처와 검증 범위',
                                levels: '운영 시나리오',
                                help: '플레이 가이드',
                            }[dialogType]
                        }}
                    </h2>
                </div>
                <button class="button button--icon" aria-label="대화상자 닫기" @click="dialog.close()">
                    <AppIcon name="close" />
                </button>
            </div>
            <template v-if="dialogType === 'results'">
                <div class="result-hero" :class="{ 'result-hero--clear': result.cleared }">
                    <span class="result-hero__icon">
                        <AppIcon :name="result.cleared ? 'check' : 'chart'" />
                    </span>
                    <div>
                        <span>{{ result.cleared ? 'SCENARIO CLEAR' : 'KEEP SCHEDULING' }}</span>
                        <h3>
                            {{ result.cleared ? '빈틈없는 운항을 완성했습니다!' : '더 나은 운항을 향해' }}
                        </h3>
                        <p>
                            {{ result.completed }}/{{ result.total }} 필수 운항편 배정 / 검증 오류
                            {{ result.issues.length }}건
                        </p>
                    </div>
                    <strong>
                        {{ result.score }}
                        <small>/ 100</small>
                    </strong>
                </div>
                <div class="score-breakdown">
                    <div
                        v-for="(label, i) in [
                            '과제 완료',
                            '준비 시간과 지연 대응 여유',
                            '운항과 사이클 부담 분산',
                            '게임용 비용 효율',
                        ]"
                        :key="label"
                    >
                        <span>
                            {{ label }}
                            <small>
                                {{
                                    [
                                        '필수 운항편 배정 비율',
                                        '현지 준비와 다음 편까지의 추가 여유',
                                        `초기 운항량을 포함한 ${dataset.aircraft.length}대의 편차`,
                                        '전체 필수 운항 비용과 사용 기체 수',
                                    ][i]
                                }}
                            </small>
                        </span>
                        <progress :value="result.parts[i]" :max="[40, 25, 20, 15][i]"></progress>
                        <strong>{{ result.parts[i] }} / {{ [40, 25, 20, 15][i] }}</strong>
                    </div>
                </div>
                <div class="result-cost">
                    <h3>
                        게임용 비용 명세
                        <span>단위: 크레딧</span>
                    </h3>
                    <p>고정 시간표의 연료와 필수 정비 비용은 배정 변경이나 필수편 누락으로 줄지 않습니다.</p>
                    <dl>
                        <div>
                            <dt>필수편 연료 / 비행 시간 × {{ dataset.rules.fuelPerHour }}</dt>
                            <dd>{{ number(result.fuel) }}</dd>
                        </div>
                        <div>
                            <dt>
                                정비 적립 / 시간 × {{ dataset.rules.reservePerHour }} + 사이클 ×
                                {{ dataset.rules.reservePerCycle }}
                            </dt>
                            <dd>{{ number(result.maintenanceReserve) }}</dd>
                        </div>
                        <div>
                            <dt>
                                필수 정비 / {{ dataset.maintenance.length }}개 ×
                                {{ dataset.rules.maintenanceCost }}
                            </dt>
                            <dd>{{ number(result.mandatoryMaintenance) }}</dd>
                        </div>
                        <div>
                            <dt>기체 가동 / {{ result.used }}대 × {{ dataset.rules.activationCost }}</dt>
                            <dd>{{ number(result.activation) }}</dd>
                        </div>
                        <div class="result-cost__total">
                            <dt>예상 운영 비용</dt>
                            <dd>{{ number(result.totalCost) }}</dd>
                        </div>
                    </dl>
                    <small>
                        실제 항공사 연료비나 수리비가 아닌 게임용 수치입니다. 대기와 준비 시간은 비행 시간에서
                        제외합니다.
                    </small>
                </div>
                <details class="score-formula">
                    <summary>점수 계산 근거와 제한 보기</summary>
                    <p>
                        배정 비율 r = 필수 배정편 / 전체 필수편. 완료 = 40r. 여유 = 25 × 평균 여유율 / (1 +
                        미배정 이외 오류 수). 여유율은 현지 최소 준비 30분을 뺀 여유와 기체별 다음 편까지의
                        준비 후 여유를 각각 30분으로 나누어 0~1로 제한합니다.
                    </p>
                    <p>
                        분산 = 20 × max(0, 1 − (시간 상대 평균절대편차 + 사이클 상대 평균절대편차) / 4). 비용
                        = 15 × (1 − 사용 기체 / 6 × 0.15). 항목별 소수 첫째 자리 반올림 후 합계를 정수로
                        표시합니다. 미배정으로 다른 항목의 점수를 올릴 수 없도록 완료 이외 항목은 필수편 전체
                        배정 후에만 지급합니다.
                    </p>
                    <p>
                        기체별 초기 시간을 포함해 {{ dataset.rules.maxHours }}시간,
                        {{ dataset.rules.maxCycles }}사이클 이내. 현지 최소 준비
                        {{ dataset.rules.destinationMinimumMinutes }}분, 도착 후 준비
                        {{ dataset.rules.turnaroundMinutes }}분. 정비는 고정 필수 블록이며 제거할 수 없습니다.
                        일회성 모드의 인접 경계는 직전 주 준비 완료 월요일 00:00, 다음 주 월요일 12:00 출발을
                        가정한 게임 조건입니다.
                    </p>
                    <p v-for="load in result.loads" :key="load.id">
                        {{ load.id }}: {{ load.hours.toFixed(2) }}시간 / {{ load.cycles }}사이클 /
                        {{ load.count }}편
                    </p>
                </details>
                <p class="modal__note">
                    {{
                        result.cleared
                            ? '이 플레이의 클리어는 한 번만 기록됩니다. 결과 재열기와 새로고침으로 중복 증가하지 않습니다.'
                            : '모든 필수편을 배정하고 오류를 해결해 보세요. 목록의 오류를 누르면 해당 블록을 확인할 수 있습니다.'
                    }}
                </p>
            </template>
            <template v-if="dialogType === 'sources'">
                <p class="modal__intro">
                    현지 출발일 기준으로 정기편을 수록합니다. 예정 시각 확인 대기 편은 운항 카드에서 조회할 수 있습니다.
                    페리는 기체 이동을 위해 추가하는 게임용 계획편입니다. 인천과 김포 사이는 45분, 다른 공항 사이는 거리를 기준으로 소요 시간을 추정합니다.
                </p>
                <article v-for="source in sources" :key="source.id" class="source-card">
                    <span class="badge badge--neutral">{{ source.status }}</span>
                    <h3>
                        <a v-if="source.sourceUrl" :href="source.sourceUrl" target="_blank" rel="noreferrer">
                            {{ source.title }}
                        </a>
                        <span v-else>{{ source.title }}</span>
                    </h3>
                    <p>{{ source.note }}</p>
                    <small>확인: {{ source.checkedAt }} / 적용: {{ source.appliesTo }}</small>
                </article>
                <p class="modal__note">
                    주간 시나리오의 기체 배정과 페리는 실제 등록기호별 운항 이력을 의미하지 않습니다.
                </p>
            </template>
            <template v-if="dialogType === 'levels'">
                <p class="modal__intro">
                    운용 기단에는 리스기가 포함됩니다. 수록 편명은 11월 16일부터 22일까지 시나리오에 반영한 범위입니다.
                </p>
                <div class="level-list">
                    <article
                        v-for="level in levels"
                        :key="level.name"
                        :class="{ 'level-list__active': level.datasetId === dataset.id }"
                        @click="selectLevel(level)"
                    >
                        <span class="level-list__difficulty">{{ level.difficulty }}</span>
                        <div>
                            <img :src="level.logo" alt="" width="68" height="24" style="object-fit: contain" />
                            <h3>{{ level.name }}</h3>
                            <p>{{ level.note }}</p>
                            <p>{{ fleetInfo[level.name] }}</p>
                        </div>
                        <span class="badge" :class="{ 'badge--neutral': !level.datasetId }">
                            {{ level.datasetId ? (level.datasetId === dataset.id ? '선택됨' : '플레이') : '미출시' }}
                        </span>
                    </article>
                </div>
                <p class="modal__note">
                    게임 배정 대수와 운항 한도는 시나리오별 설정입니다.
                </p>
            </template>
            <template v-if="dialogType === 'help'">
                <ol class="help-list">
                    <li>
                        <strong>운항편을 선택하세요.</strong>
                        <p>보관함 또는 타임라인의 블록을 클릭하거나 키보드 Tab과 Enter로 선택합니다.</p>
                    </li>
                    <li>
                        <strong>기체를 배정하세요.</strong>
                        <p>
                            상세의 배정 기체 메뉴를 사용하거나 블록 전체를 기체 행으로 드래그합니다. 시각은
                            바뀌지 않으며 주간 시간표의 각 편도편을 개별 배정합니다.
                        </p>
                    </li>
                    <li>
                        <strong>공항과 준비 시간을 확인하세요.</strong>
                        <p>
                            김포 GMP와 인천 ICN은 다른 공항입니다. 도착 후 준비 45분과 현지 준비 30분은 게임
                            규칙입니다. 1회 이착륙은 1사이클, 왕복은 2사이클입니다.
                        </p>
                    </li>
                    <li>
                        <strong>검증하고 운항을 완성하세요.</strong>
                        <p>
                            체크리스트에서 오류를 선택해 수정한 뒤 운항 검증을 누르세요. 필수편 전부 배정,
                            오류 0건, 80점 이상이 목표입니다.
                        </p>
                    </li>
                    <li>
                        <strong>진행 상황을 저장하세요.</strong>
                        <p>
                            로컬 저장과 불러오기는 이 브라우저의 localStorage를 사용하며, CSV 파일로도
                            저장하고 불러올 수 있습니다. 한 번의 배정 변경은 한 번의 되돌리기로 복원됩니다.
                            Ctrl 또는 ⌘ + Z, Shift + Z를 지원합니다. 새로고침 시 현재 탭의 진행도 복원합니다.
                        </p>
                    </li>
                </ol>
            </template>
            <div class="modal__footer">
                <button class="button button--primary" @click="dialog.close()">
                    {{ dialogType === 'results' ? '운항 계획 계속하기' : '확인' }}
                </button>
            </div>
        </dialog>
    </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import AppIcon from './components/AppIcon.vue';
import FlightBlock from './components/FlightBlock.vue';
import { airports, datasets as existingDatasets, makeWeeklyDataset, makeLegScenario, sources } from './data/schedules';
import { dayLabel, getRouteCatalog } from './data/weeklyNetwork';
import { airlineSchedules } from './data/airlineSchedules';
import {
    evaluate,
    getBlocks,
    manualFerry, ferryCost, ferryConnections,
    makeSave,
    parseSave,
    recordClear,
    SAVE_KEY,
    PROGRESS_KEY,
    MINUTE,
    HOUR,
} from './game';

const weeklyDatasets = airlineSchedules
    .filter((airline) => ['WE', 'BX', 'LJ', 'OZ', 'KE'].includes(airline.code))
    .map((airline) => makeWeeklyDataset(airline.schedules, airline.code, airline.networkSchedules));
const datasets = [...existingDatasets, ...weeklyDatasets].map((d) => d.kind === 'weekly'
    ? makeLegScenario(d, airlineSchedules.find((a) => a.code === d.airlineCode)) : d);
const dataset = shallowRef(datasets[0]);
const currentPage = ref('scheduler');
const selectedAirlineId = ref('airseoul');
const departureGroupFilter = ref('all');
const assignments = shallowRef([]);
const repeat = ref(false);
const playId = ref(crypto.randomUUID());
const undoStack = ref([]);
const redoStack = ref([]);
const selectedId = ref(null);
const airportFilter = ref('all');
const dragId = ref(null);
const pickerDragging = ref(false);
const dragOver = ref(null);
const notice = ref('');
const storageError = ref('');
const dialog = ref(null);
const dialogType = ref('results');
const timelineSection = ref(null);
const timelineScroll = ref(null);
const csvInput = ref(null);
let noticeTimer;
const fleetInfo = {
    '파라타항공': '운용 5대 (10월 확인) / A320-200 2대, A330-200 3대. 6호기 HL8788 도입 계약',
    '에어프레미아': '운용 9대 (11월 20일) / B787-9',
    '에어서울': '운용 6대 (9월 말) / A321-200',
    '에어부산': '운용 21대 (10월 16일) / A320-200, A321-200, A321neo',
    '진에어': '리스 33대 (9월 말) / B737-800 19대, B737-900 3대, B737-8 7대, B777-200 3대, A321-200 1대',
    '아시아나항공': '여객기 66대 (9월 말) / A321, A330, A350, A380, B777',
    '대한항공': '운용 166대 (9월) / 여객기 143대, 화물기 23대. A220, A321, A330, A350, A380, B737, B747, B777, B787',
};
const levels = ['WE', 'YP', 'RS', 'BX', 'LJ', 'OZ', 'KE'].map((code) => {
    const scenario = datasets.find((item) => item.airlineCode === code && item.kind === 'weekly');
    const airline = airlineSchedules.find((item) => item.code === code);
    return {
        name: airline.name, logo: airline.logo, datasetId: scenario.id,
        difficulty: scenario.difficulty.split(' ')[0],
        note: `수록 편명 ${new Set(scenario.flights.map((flight) => flight.number)).size}개 / 주간 ${scenario.flights.length}편 / 배정 기체 ${scenario.aircraft.length}대`,
    };
});
const blocks = computed(() => getBlocks(dataset.value));
const selectedAirline = computed(
    () => airlineSchedules.find((airline) => airline.id === selectedAirlineId.value) || airlineSchedules[0],
);
const scenarioAirline = computed(() =>
    airlineSchedules.find((airline) => airline.code === dataset.value.airlineCode),
);
const routeCatalog = computed(() => getRouteCatalog(selectedAirline.value));
const originOptions = computed(() => [...new Map(routeCatalog.value.map((route) => [route.from, route.origin]))]);
const visibleRoutes = computed(() => routeCatalog.value.filter(
    (route) => departureGroupFilter.value === 'all' || route.from === departureGroupFilter.value,
));
const result = computed(() => evaluate(dataset.value, assignments.value, repeat.value));
const ferryOptions = computed(() => ferryConnections(dataset.value, assignments.value, blocks.value));
const ferryDialog = ref(null);
const ferryPlane = ref('');
const ferryAnchor = ref('');
const ferryTo = ref('');
const ferryLegs = computed(() => blocks.value.filter((b) => assignedPlane(b.id) === ferryPlane.value).sort((a,b) => a.start - b.start));
const ferryBase = computed(() => dataset.value.aircraft.find((p) => p.id === ferryPlane.value)?.startAirport);
const ferryOriginLeg = computed(() => ferryLegs.value.find((b) => b.id === ferryAnchor.value));
const ferryOrigin = computed(() => ferryOriginLeg.value?.inbound.to || ferryBase.value);
const ferryAirports = computed(() => [...new Set(dataset.value.flights.flatMap((f) => [f.from, f.to]))].sort());
const ferryPreview = computed(() => manualFerry(dataset.value, {
    rotationId: ['ferry', ferryOrigin.value, ferryTo.value, ferryOriginLeg.value?.end || dataset.value.weekStart, ferryPlane.value].join(':'),
    aircraftId: ferryPlane.value,
}));
const ferryWarning = computed(() => {
    const f = ferryPreview.value;
    if (!f) return ferryTo.value ? '해당 구간의 이동 시간을 계산할 수 없습니다.' : '';
    const busy = [...ferryLegs.value, ...ferryOptions.value.filter((x) => x.active && x.aircraftId === ferryPlane.value),
        ...dataset.value.maintenance.filter((x) => x.aircraftId === ferryPlane.value)];
    return busy.some((x) => x.start < f.end && x.end > f.start) ? '이동 또는 도착 준비 시간이 기존 일정과 겹칩니다.' : '';
});
function resetFerryDestination() {
    const next = ferryLegs.value.find((b) => b.start >= (ferryOriginLeg.value?.end || dataset.value.weekStart));
    ferryTo.value = next && next.outbound.from !== ferryOrigin.value ? next.outbound.from : '';
}
function resetFerryOrigin() {
    ferryAnchor.value = ferryLegs.value.find((b) => b.id === selectedId.value)?.id || '';
    resetFerryDestination();
}
function openFerry() {
    ferryPlane.value = assignedPlane(selectedId.value) || dataset.value.aircraft[0].id;
    resetFerryOrigin();
    ferryDialog.value.showModal();
}
function addManualFerry() {
    const f = ferryPreview.value;
    if (!f || ferryWarning.value) return;
    commit([...assignments.value, { rotationId: f.id, aircraftId: f.aircraftId }]);
    ferryDialog.value.close();
    toast(`${f.from} → ${f.to} 페리 추가 / ${f.minutes}분 / ${number(ferryCost(dataset.value, f.minutes))} 크레딧`);
}
const selectedFerry = computed(() => ferryOptions.value.find((f) => f.id === selectedId.value));
function toggleFerry(f) {
    commit(assignments.value.map((a) => a.rotationId === f.id ? { ...a, ferryFrom: f.active ? undefined : f.previous } : a));
}
const conflicts = computed(() => result.value.issues.filter((i) => i.code !== 'unassigned'));
const assignmentIndex = computed(() => new Map(assignments.value.map((a) => [a.rotationId, a.aircraftId])));
const unassigned = computed(() =>
    blocks.value
        .filter((b) => !assignmentIndex.value.has(b.id))
        .sort(
            (a, b) =>
                a.start - b.start ||
                a.outbound.departureLocal.localeCompare(b.outbound.departureLocal) ||
                a.outbound.number.localeCompare(b.outbound.number),
        ),
);
const filteredUnassigned = computed(() =>
    unassigned.value.filter((b) => airportFilter.value === 'all' || b.outbound.from === airportFilter.value),
);
const trayPage = ref(1);
const trayPageSize = 12;
const trayPageCount = computed(() => Math.max(1, Math.ceil(filteredUnassigned.value.length / trayPageSize)));
const trayPageBlocks = computed(() => filteredUnassigned.value.slice((trayPage.value - 1) * trayPageSize, trayPage.value * trayPageSize));
watch([airportFilter, dataset], () => { trayPage.value = 1; });
watch(trayPageCount, (count) => { trayPage.value = Math.min(trayPage.value, count); });
const picker = ref(null);
const pendingList = ref(null);
async function openPending() {
    openPicker();
    pickerStatus.value = 'all';
    await nextTick();
    if (pendingList.value) pendingList.value.open = true;
}
const pickerQuery = ref('');
const pendingMatches = computed(() => (dataset.value.pending || []).filter((f) =>
    [f.number, f.from, f.to, airports[f.from].name, airports[f.to].name].join(' ').toLowerCase().includes(pickerQuery.value.toLowerCase())));
const pickerStatus = ref('pending');
const pickerVisible = ref(false);
function openPicker() {
    pickerQuery.value = '';
    pickerStatus.value = unassigned.value.length ? 'pending' : 'all';
    pickerVisible.value = true;
    if (!picker.value.open) picker.value.show();
}
const pickerBlocks = computed(() => {
    if (!pickerVisible.value) return [];
    const query = pickerQuery.value.toLowerCase();
    const planes = new Map(assignments.value.map((a) => [a.rotationId, a.aircraftId]));
    return blocks.value.filter(({ id, outbound, inbound }) => {
        const plane = planes.get(id);
        if (pickerStatus.value === 'pending' && plane || pickerStatus.value === 'assigned' && !plane) return false;
        return [outbound.number, inbound.number, outbound.from, outbound.to, airports[outbound.from].name,
            airports[outbound.to].name, plane].join(' ').toLowerCase().includes(query);
    });
});
const selected = computed(() => blocks.value.find((b) => b.id === selectedId.value));
const days = computed(() =>
    Array.from({ length: 7 }, (_, index) => ({
        index,
        start: dataset.value.weekStart + index * 24 * HOUR,
        label: ['월', '화', '수', '목', '금', '토', '일'][index],
    })),
);
const answerShown = ref(false);
watch(dataset, () => { answerShown.value = false; });
const rangeStart = computed(() => dataset.value.weekStart);
const rangeEnd = computed(() => dataset.value.weekEnd);
const formatDate = (value) =>
    new Intl.DateTimeFormat('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
        timeZone: 'Asia/Seoul',
    }).format(value);
const formatTime = (value) =>
    new Intl.DateTimeFormat('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
        timeZone: 'Asia/Seoul',
    }).format(value);
const number = (value) => Math.round(value).toLocaleString('ko-KR');
const assignedPlane = (id) => assignmentIndex.value.get(id) || '';
const loadFor = (id) => result.value.loads.find((l) => l.id === id);
const hasIssue = (id) => conflicts.value.some((i) => i.blockId === id);
const issuesForPlane = (id) => conflicts.value.some((i) => i.aircraftId === id);
function visible(b) {
    return b.start < rangeEnd.value && b.end > rangeStart.value;
}
const timelineRows = computed(() => {
    const rows = new Map(dataset.value.aircraft.map(({ id }) => [id, { blocks: [], ends: [], lanes: new Map() }]));
    for (const block of blocks.value) {
        const row = rows.get(assignedPlane(block.id));
        if (row && visible(block)) row.blocks.push(block);
    }
    for (const row of rows.values()) {
        row.blocks.sort((a, b) => a.start - b.start);
        for (const block of row.blocks) {
            let lane = row.ends.findIndex((end) => end <= block.start);
            if (lane < 0) lane = row.ends.length;
            row.ends[lane] = block.end;
            row.lanes.set(block.id, lane);
        }
    }
    return rows;
});
const planeBlocks = (id) => timelineRows.value.get(id).blocks;
const laneFor = (blockId, id) => timelineRows.value.get(id).lanes.get(blockId);
const rowHeight = (id) => 46 + Math.max(0, timelineRows.value.get(id).ends.length - 1) * 38;
function visibleMaintenance(id) {
    return dataset.value.maintenance.filter((m) => m.aircraftId === id && visible(m));
}
function position(block) {
    const start = Math.max(block.start, rangeStart.value);
    const end = Math.min(block.end, rangeEnd.value);
    return {
        left: `${((start - rangeStart.value) / (rangeEnd.value - rangeStart.value)) * 100}%`,
        width: `${((end - start) / (rangeEnd.value - rangeStart.value)) * 100}%`,
    };
}
function toast(message) {
    notice.value = message;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => (notice.value = ''), 6500);
}
function persistSession() {
    try {
        sessionStorage.setItem(
            `flight-session-${dataset.value.id}`,
            JSON.stringify(makeSave(dataset.value, assignments.value, playId.value, repeat.value)),
        );
    } catch {
        toast('현재 탭의 자동 복원을 사용할 수 없습니다. 저장 버튼을 이용해 주세요.');
    }
}
function seed() {
    const b = blocks.value;
    const fleet = dataset.value.aircraft;
    assignments.value = [
        b[0] && { rotationId: b[0].id, aircraftId: fleet[0].id },
        b[1] && { rotationId: b[1].id, aircraftId: fleet[0].id },
        b[4] && { rotationId: b[4].id, aircraftId: fleet[Math.min(4, fleet.length - 1)].id },
    ].filter(Boolean);
    selectedId.value = b[0].id;
}
function restoreSession() {
    try {
        const raw = sessionStorage.getItem(`flight-session-${dataset.value.id}`);
        if (raw) {
            const saved = parseSave(raw, dataset.value);
            assignments.value = saved.assignments;
            playId.value = saved.playId;
            repeat.value = saved.repeat;
            selectedId.value = blocks.value[0].id;
            return;
        }
    } catch {
        toast('현재 탭의 자동 복원 데이터가 올바르지 않아 새로 시작합니다.');
    }
    seed();
    persistSession();
}
function commit(next) {
    if (JSON.stringify(next) === JSON.stringify(assignments.value)) return;
    undoStack.value.push(structuredClone(assignments.value.map((a) => ({ ...a }))));
    redoStack.value = [];
    assignments.value = next;
    persistSession();
}
function assign(id, planeId) {
    if (
        !blocks.value.some((b) => b.id === id) ||
        (planeId && !dataset.value.aircraft.some((p) => p.id === planeId))
    )
        return;
    const next = assignments.value.filter((a) => a.rotationId !== id);
    if (planeId) next.push({ rotationId: id, aircraftId: planeId });
    commit(next);
    selectedId.value = id;
    if (planeId) focusSelectedBlock();
    toast(planeId ? `${planeId}에 운항편을 배정했습니다.` : '운항편을 미배정 보관함으로 옮겼습니다.');
}
function undo() {
    if (!undoStack.value.length) return;
    redoStack.value.push(assignments.value.map((a) => ({ ...a })));
    assignments.value = undoStack.value.pop();
    persistSession();
}
function redo() {
    if (!redoStack.value.length) return;
    undoStack.value.push(assignments.value.map((a) => ({ ...a })));
    assignments.value = redoStack.value.pop();
    persistSession();
}
function startPickerDrag(event, id) {
    event.dataTransfer.setData('text/plain', id);
    event.dataTransfer.effectAllowed = 'move';
    dragId.value = id;
    selectedId.value = id;
    pickerDragging.value = true;
}
function drop(event, planeId) {
    const id = event.dataTransfer.getData('text/plain');
    if (pickerDragging.value) picker.value?.close();
    assign(id, planeId);
    endDrag();
}
function endDrag() {
    pickerDragging.value = false;
    dragId.value = null;
    dragOver.value = null;
}
function selectBlock(id) {
    selectedId.value = id;
}
async function focusSelectedBlock(scrollPage = true) {
    await nextTick();
    const timeline = timelineScroll.value;
    const block = timeline?.querySelector(`[data-rotation-id="${selectedId.value}"]`);
    if (!block) return;
    const aircraftColumn = timeline.querySelector('.timeline__corner').offsetWidth;
    const offset =
        block.getBoundingClientRect().left - timeline.getBoundingClientRect().left + timeline.scrollLeft;
    timeline.scrollTo({ left: Math.max(0, offset - aircraftColumn - 24), behavior: 'smooth' });
    if (scrollPage) block.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
}
function scrollTimeline() {
    currentPage.value = 'scheduler';
    nextTick(() => timelineSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}
function changeDataset(id) {
    persistSession();
    dataset.value = datasets.find((d) => d.id === id) || datasets[0];
    selectedAirlineId.value = scenarioAirline.value?.id || selectedAirlineId.value;
    repeat.value = false;
    playId.value = crypto.randomUUID();
    undoStack.value = [];
    redoStack.value = [];
    airportFilter.value = 'all';
    updateShareUrl();
    restoreSession();
    focusSelectedBlock(false);
}
function selectLevel(level) {
    if (!level.datasetId) {
        window.alert(`${level.name} 시나리오는 아직 미출시입니다.`);
        return;
    }
    changeDataset(level.datasetId);
    dialog.value.close();
}
function updateShareUrl() {
    const airline = airlineSchedules.find((item) => item.code === dataset.value.airlineCode);
    if (!airline) return;
    const url = new URL(window.location.href);
    url.searchParams.set('airline', airline.id);
    url.searchParams.set('scenario', dataset.value.id);
    window.history.replaceState(null, '', url);
}
function newPlay() {
    playId.value = crypto.randomUUID();
    undoStack.value = [];
    redoStack.value = [];
    seed();
    persistSession();
    toast('새 플레이를 시작했습니다. 예시 충돌을 해결해 보세요.');
}
function save() {
    try {
        localStorage.setItem(
            SAVE_KEY,
            JSON.stringify(
                makeSave(
                    dataset.value,
                    assignments.value.map((a) => ({ ...a })),
                    playId.value,
                    repeat.value,
                ),
            ),
        );
        toast('이 브라우저에 운항 계획을 저장했습니다.');
    } catch {
        storageError.value = '저장 공간 부족 또는 브라우저 설정으로 저장할 수 없습니다.';
    }
}
function load() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) {
            toast('저장된 운항 계획이 없습니다.');
            return;
        }
        const saved = parseSave(raw, dataset.value);
        commit(saved.assignments);
        playId.value = saved.playId;
        repeat.value = saved.repeat;
        persistSession();
        toast('저장된 운항 계획을 불러왔습니다.');
    } catch (error) {
        storageError.value = error.message;
    }
}
function escapeCsv(value) {
    const text = String(value ?? '');
    return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
function parseCsvRows(raw) {
    const rows = [];
    let row = [];
    let value = '';
    let quoted = false;
    for (let index = 0; index < raw.length; index += 1) {
        const char = raw[index];
        if (quoted && char === '"' && raw[index + 1] === '"') {
            value += '"';
            index += 1;
        } else if (char === '"') {
            quoted = !quoted;
        } else if (char === ',' && !quoted) {
            row.push(value);
            value = '';
        } else if ((char === '\n' || char === '\r') && !quoted) {
            if (char === '\r' && raw[index + 1] === '\n') index += 1;
            row.push(value);
            if (row.some((cell) => cell !== '')) rows.push(row);
            row = [];
            value = '';
        } else {
            value += char;
        }
    }
    if (quoted) throw new Error('CSV 파일의 따옴표 형식이 올바르지 않습니다.');
    row.push(value);
    if (row.some((cell) => cell !== '')) rows.push(row);
    return rows;
}
function saveCsv() {
    const saved = makeSave(dataset.value, assignments.value, playId.value, repeat.value);
    const header = ['version', 'datasetId', 'playId', 'repeat', 'savedAt', 'rotationId', 'aircraftId', 'ferryFrom'];
    const items = saved.assignments.length ? saved.assignments : [{ rotationId: '', aircraftId: '' }];
    const rows = items.map((assignment) => [
        saved.version,
        saved.datasetId,
        saved.playId,
        saved.repeat,
        saved.savedAt,
        assignment.rotationId,
        assignment.aircraftId,
        assignment.ferryFrom || '',
    ]);
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `flight-scheduler-${dataset.value.airlineCode}-${saved.savedAt.slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast('운항 계획을 CSV 파일로 저장했습니다.');
}
async function loadCsv(event) {
    const [file] = event.target.files;
    if (!file) return;
    try {
        const rows = parseCsvRows((await file.text()).replace(/^\uFEFF/, ''));
        const header = rows.shift();
        const expected = ['version', 'datasetId', 'playId', 'repeat', 'savedAt', 'rotationId', 'aircraftId'];
        if (!header || expected.some((name, index) => header[index] !== name) || !rows.length)
            throw new Error('지원하지 않는 CSV 형식입니다.');
        const [first] = rows;
        const saved = {
            version: Number(first[0]),
            datasetId: first[1],
            playId: first[2],
            repeat: first[3] === 'true',
            savedAt: first[4],
            assignments: rows
                .filter((row) => row[5] || row[6])
                .map((row) => ({ rotationId: row[5], aircraftId: row[6], ...(row[7] ? { ferryFrom: row[7] } : {}) })),
        };
        const parsed = parseSave(JSON.stringify(saved), dataset.value);
        commit(parsed.assignments);
        playId.value = parsed.playId;
        repeat.value = parsed.repeat;
        persistSession();
        toast('CSV 파일의 운항 계획을 불러왔습니다.');
    } catch (error) {
        storageError.value = error.message;
    } finally {
        event.target.value = '';
    }
}
function clearSave() {
    try {
        localStorage.removeItem(SAVE_KEY);
        storageError.value = '';
        toast('수동 저장 데이터를 초기화했습니다. 현재 배정은 유지됩니다.');
    } catch {
        storageError.value = '브라우저가 저장소 접근을 차단했습니다.';
    }
}
function openDialog(type) {
    dialogType.value = type;
    if (!dialog.value.open) dialog.value.showModal();
}
function closeOnBackdrop(event) {
    if (event.target !== dialog.value) return;
    const rect = dialog.value.getBoundingClientRect();
    if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
    )
        dialog.value.close();
}
function showResults() {
    if (result.value.cleared) {
        try {
            persistSession();
            const progress = recordClear(localStorage.getItem(PROGRESS_KEY), playId.value);
            localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
            localStorage.setItem(
                SAVE_KEY,
                JSON.stringify(
                    makeSave(
                        dataset.value,
                        assignments.value.map((a) => ({ ...a })),
                        playId.value,
                        repeat.value,
                    ),
                ),
            );
        } catch (error) {
            storageError.value = `클리어 기록 저장 실패: ${error.message}`;
        }
    }
    openDialog('results');
}
const answerBusy = ref(false);
let answerWorker;
function stopAnswer() {
    answerWorker?.terminate();
    answerWorker = null;
    answerBusy.value = false;
}
watch(dataset, stopAnswer);
onBeforeUnmount(stopAnswer);
function showAnswer() {
    if (answerBusy.value) return;
    const scenario = dataset.value;
    const original = assignments.value;
    answerBusy.value = true;
    try {
        answerWorker = new Worker(new URL('./answer.worker.js', import.meta.url), { type: 'module' });
        answerWorker.onmessage = ({ data }) => {
            stopAnswer();
            if (data.error) return toast(data.error);
            if (dataset.value !== scenario || assignments.value !== original) return toast('배정이 변경되어 계산 결과를 적용하지 않았습니다.');
            commit(data.plan);
            selectedId.value = blocks.value[0]?.id || null;
            answerShown.value = true;
            toast(`비교한 배정안 중 최고 ${result.value.score}점 / ${result.value.completed}편 배정 / 연결 검토 ${conflicts.value.length}건`);
        };
        answerWorker.onerror = () => { stopAnswer(); toast('배정안을 계산하지 못했습니다. 다시 시도해 주세요.'); };
        answerWorker.postMessage({ dataset: scenario, current: original.map((a) => ({ ...a })) });
    } catch (error) {
        stopAnswer();
        toast(error.message);
    }
}
function keydown(event) {
    if (event.key === 'Escape' && picker.value?.open && !dialog.value?.open) {
        picker.value.close();
        return;
    }
    if (ferryDialog.value?.open || dialog.value?.open || /INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        event.shiftKey ? redo() : undo();
    }
}
watch(repeat, persistSession);
onMounted(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedAirline = airlineSchedules.find((airline) => airline.id === params.get('airline'));
    const sharedDataset = datasets.find((item) => item.id === params.get('scenario') || item.id === params.get('scenario') + '-legs');
    const airlineDataset = datasets.find((item) => item.airlineCode === sharedAirline?.code);
    if (sharedDataset && (!sharedAirline || sharedDataset.airlineCode === sharedAirline.code))
        dataset.value = sharedDataset;
    else if (airlineDataset) dataset.value = airlineDataset;
    if (sharedAirline) selectedAirlineId.value = sharedAirline.id;
    updateShareUrl();
    restoreSession();
    focusSelectedBlock(false);
    window.addEventListener('keydown', keydown);
});
onBeforeUnmount(() => {
    window.removeEventListener('keydown', keydown);
    clearTimeout(noticeTimer);
});
</script>
