<template>
    <div class="scheduler">
        <aside class="sidebar" aria-label="앱 메뉴">
            <a class="sidebar__brand" href="#main" aria-label="Flight Scheduler 메인">
                <AppIcon name="plane" />
            </a>
            <span class="sidebar__divider"></span>
            <button
                class="sidebar__item sidebar__item--active"
                aria-label="운항 스케줄"
                title="운항 스케줄"
                @click="scrollTimeline"
            >
                <AppIcon name="calendar" />
            </button>
            <button
                class="sidebar__item"
                aria-label="시나리오와 난이도"
                title="시나리오와 난이도"
                @click="openDialog('levels')"
            >
                <AppIcon name="grid" />
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
                <span class="topbar__section">운항 계획실</span>
                <div class="topbar__right">
                    <span class="topbar__local">브라우저 로컬 플레이</span>
                    <button class="button button--quiet" @click="openDialog('help')">
                        <AppIcon name="help" />
                        플레이 가이드
                    </button>
                </div>
            </header>
            <main id="main" class="workspace">
                <div class="page-heading">
                    <div>
                        <div class="eyebrow">AIRLINE OPERATIONS PUZZLE</div>
                        <h1>
                            나만의 운항을 설계하세요
                            <span class="page-heading__plane">✈</span>
                        </h1>
                        <p>정해진 시간표, 여섯 대의 항공기. 빈틈없는 한 주를 완성해 보세요.</p>
                    </div>
                    <button class="scenario-pill" @click="openDialog('levels')">
                        <span class="scenario-pill__logo">
                            AIR
                            <br />
                            SEOUL
                        </span>
                        <span>
                            <strong>에어서울</strong>
                            <small>최하 난이도 / 가상 기체 6대</small>
                        </span>
                        <AppIcon name="settings" />
                    </button>
                </div>

                <div class="scenario-bar">
                    <span class="badge">
                        {{ dataset.kind === 'partial' ? '부분 시간표' : '가상 시간표' }}
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
                            dataset.kind === 'partial'
                                ? '11.20 일부 예정편 + 11.21 오사카편만 수록. 미확인 날짜는 비어 있습니다.'
                                : 'FS 편명과 모든 시각은 게임용 창작 데이터입니다.'
                        }}
                    </span>
                    <button class="text-button" @click="openDialog('sources')">출처와 검증 범위</button>
                </div>

                <section class="metrics" aria-label="운영 요약">
                    <article class="metric">
                        <div class="metric__icon"><AppIcon name="check" /></div>
                        <div>
                            <span class="metric__label">배정 왕복편</span>
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
                                <small>/ 6대</small>
                            </strong>
                        </div>
                        <span class="metric__note">가상 식별자 AS01–06</span>
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
                                <span class="week-label">2026.11.16 – 11.22</span>
                            </h2>
                        </div>
                        <div class="timeline-toolbar__actions">
                            <div class="segmented" aria-label="시간축 확대">
                                <button
                                    :class="{ 'is-active': view === 'week' }"
                                    :aria-pressed="view === 'week'"
                                    @click="view = 'week'"
                                >
                                    주간
                                </button>
                                <button
                                    :class="{ 'is-active': view === 'day' }"
                                    :aria-pressed="view === 'day'"
                                    @click="view = 'day'"
                                >
                                    하루 확대
                                </button>
                            </div>
                            <label v-if="view === 'day'" class="day-select">
                                <span class="sr-only">표시 날짜</span>
                                <select v-model.number="dayIndex">
                                    <option v-for="(day, i) in days" :key="i" :value="i">
                                        {{ day.label }}
                                    </option>
                                </select>
                            </label>
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
                                저장
                            </button>
                            <button class="button" @click="load">
                                <AppIcon name="folder" />
                                불러오기
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
                    <div
                        class="timeline-scroll"
                        tabindex="0"
                        aria-label="항공기 운항 타임라인, 가로 스크롤 가능"
                    >
                        <div
                            class="timeline"
                            :style="{
                                '--track-width': trackWidth + 'px',
                                '--day-width': trackWidth / (view === 'week' ? 7 : 1) + 'px',
                                '--hour-width': trackWidth / (view === 'week' ? 168 : 24) + 'px',
                            }"
                        >
                            <div class="timeline__header">
                                <div class="timeline__corner">
                                    항공기
                                    <small>가상 기체 / 시작 공항</small>
                                </div>
                                <div class="timeline__dates">
                                    <div
                                        v-for="day in visibleDays"
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
                                            <span
                                                v-for="hour in view === 'week'
                                                    ? ['00', '06', '12', '18']
                                                    : [
                                                          '00:00',
                                                          '02:00',
                                                          '04:00',
                                                          '06:00',
                                                          '08:00',
                                                          '10:00',
                                                          '12:00',
                                                          '14:00',
                                                          '16:00',
                                                          '18:00',
                                                          '20:00',
                                                          '22:00',
                                                      ]"
                                                :key="hour"
                                            >
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
                                :class="{ 'timeline__row--drop': dragOver === plane.id }"
                                :style="{ minHeight: rowHeight(plane.id) + 'px' }"
                                @dragover.prevent="dragOver = plane.id"
                                @dragleave="dragOver = null"
                                @drop.prevent="drop($event, plane.id)"
                            >
                                <div class="timeline__aircraft">
                                    <span class="timeline__aircraft-icon"><AppIcon name="plane" /></span>
                                    <div>
                                        <strong>{{ plane.id }}</strong>
                                        <small>
                                            {{ plane.startAirport }}
                                            <span>{{ loadFor(plane.id).count }}개 왕복</span>
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
                                    <FlightBlock
                                        v-for="block in planeBlocks(plane.id)"
                                        :key="block.id"
                                        :block="block"
                                        compact
                                        :selected="selectedId === block.id"
                                        :invalid="hasIssue(block.id)"
                                        :style="{
                                            ...position(block),
                                            top: 12 + laneFor(block.id, plane.id) * 73 + 'px',
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
                                        {{ dragId ? '여기에 왕복편 배정' : '배정 가능한 시간' }}
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
                                귀환 후 준비
                            </span>
                            <span>
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
                                    미배정 왕복편
                                    <span class="count-badge">{{ unassigned.length }}</span>
                                </h2>
                                <p>한 블록에 왕편, 현지 대기, 복편, 귀환 후 준비가 포함됩니다.</p>
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
                        <div class="tray__grid">
                            <FlightBlock
                                v-for="block in filteredUnassigned"
                                :key="block.id"
                                :block="block"
                                :selected="selectedId === block.id"
                                @select="selectBlock"
                                @drag-start="dragId = $event"
                                @drag-end="endDrag"
                            />
                            <div v-if="!filteredUnassigned.length" class="empty-state">
                                <AppIcon :name="unassigned.length ? 'box' : 'check'" />
                                <strong>
                                    {{
                                        unassigned.length
                                            ? '이 공항의 미배정편이 없습니다.'
                                            : '모든 왕복편을 배정했습니다.'
                                    }}
                                </strong>
                                <span>배정된 블록을 이곳으로 옮기면 배정이 해제됩니다.</span>
                            </div>
                        </div>
                    </section>
                    <section class="panel detail" aria-labelledby="detail-title">
                        <div class="panel-heading">
                            <h2 id="detail-title">왕복편 상세</h2>
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
                                    v-for="(flight, i) in [selected.outbound, selected.inbound]"
                                    :key="flight.id"
                                >
                                    <span class="detail__leg-number">
                                        {{ i ? '복편' : '왕편' }}
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
                                        {{ flight.from }} → {{ flight.to }} / {{ flight.departureDate }}
                                    </span>
                                    <small>
                                        현지 {{ flight.departureTimeZone }} / {{ flight.arrivalTimeZone }}
                                    </small>
                                    <small>
                                        KST {{ formatDate(Date.parse(flight.scheduledDeparture)) }} →
                                        {{ formatDate(Date.parse(flight.scheduledArrival)) }}
                                    </small>
                                </div>
                            </div>
                            <div class="detail__facts">
                                <span>
                                    순수 비행
                                    <strong>{{ selected.hours.toFixed(2) }}시간</strong>
                                </span>
                                <span>
                                    현지 대기
                                    <strong>
                                        {{ Math.round((selected.inStart - selected.outEnd) / MINUTE) }}분
                                    </strong>
                                </span>
                                <span>
                                    귀환 후 준비
                                    <strong>{{ selected.turnaroundMinutes }}분</strong>
                                </span>
                                <span>
                                    사이클
                                    <strong>2회</strong>
                                </span>
                            </div>
                            <label class="detail__assign">
                                배정 기체
                                <select
                                    :value="assignedPlane(selected.id)"
                                    aria-label="선택한 왕복편 배정 기체"
                                    @change="assign(selected.id, $event.target.value || null)"
                                >
                                    <option value="">미배정 보관함</option>
                                    <option
                                        v-for="plane in dataset.aircraft"
                                        :key="plane.id"
                                        :value="plane.id"
                                    >
                                        {{ plane.id }} / {{ plane.startAirport }} 시작
                                    </option>
                                </select>
                            </label>
                            <p class="detail__source">
                                {{
                                    dataset.kind === 'partial'
                                        ? '보조 출처 확인 / 공식 주간 검증 미완료'
                                        : '가상 연습용 시간표'
                                }}
                                <br />
                                준비 시간, 정비와 기체 수는 게임 설정입니다.
                            </p>
                            <button class="text-button" @click="focusSelectedDay">
                                이 왕복편 날짜로 확대
                            </button>
                        </template>
                        <div v-else class="empty-state">
                            <AppIcon name="plane" />
                            <strong>왕복편을 선택하세요.</strong>
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
                                    v-if="blocks.some((b) => b.id === issue.blockId)"
                                    @click="
                                        selectBlock(issue.blockId);
                                        focusSelectedDay();
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
        </div>
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
                            {{ result.completed }}/{{ result.total }} 필수 왕복편 배정 / 검증 오류
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
                                        '필수 왕복편 배정 비율',
                                        '현지 준비와 다음 편까지의 추가 여유',
                                        '초기 운항량을 포함한 6대의 편차',
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
                            <dt>필수 정비 / 6개 × {{ dataset.rules.maintenanceCost }}</dt>
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
                        {{ dataset.rules.destinationMinimumMinutes }}분, 귀환 후 준비
                        {{ dataset.rules.turnaroundMinutes }}분. 정비는 고정 필수 블록이며 제거할 수 없습니다.
                        일회성 모드의 인접 경계는 직전 주 준비 완료 월요일 00:00, 다음 주 월요일 12:00 출발을
                        가정한 게임 조건입니다.
                    </p>
                    <p v-for="load in result.loads" :key="load.id">
                        {{ load.id }}: {{ load.hours.toFixed(2) }}시간 / {{ load.cycles }}사이클 /
                        {{ load.count }}왕복
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
                    공식 주간 전체 시간표는 확보하지 못했습니다. 실제 튜토리얼은 11월 20일 왕복 7개와 11월
                    21일 오사카 왕복 1개만 수록합니다. 예정 시각만 사용하며, 날짜를 반복해 주간 자료로 만들지
                    않았습니다.
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
                    왕복 연결은 게임용 그룹입니다. 동일 기체의 실제 운항 이력은 확인하지 않았습니다. 참고 화면
                    첨부는 현재 대화에서 확인되지 않아 요청한 정보 구조를 기준으로 구성했습니다.
                </p>
            </template>
            <template v-if="dialogType === 'levels'">
                <p class="modal__intro">
                    기체 수는 실제 보유 대수를 재현한 것이 아닌 게임 시나리오 설정입니다.
                </p>
                <div class="level-list">
                    <article
                        v-for="level in levels"
                        :key="level.name"
                        :class="{ 'level-list__active': level.name === '에어서울' }"
                    >
                        <span class="level-list__difficulty">{{ level.difficulty }}</span>
                        <div>
                            <h3>{{ level.name }}</h3>
                            <p>{{ level.note }}</p>
                        </div>
                        <span class="badge" :class="{ 'badge--neutral': level.name !== '에어서울' }">
                            {{ level.name === '에어서울' ? '플레이 가능' : '준비 중' }}
                        </span>
                    </article>
                </div>
                <p class="modal__note">
                    마스터 난이도의 진에어를 서로 다른 플레이에서 3회 클리어하면 실무가 해금됩니다. 현재
                    에어서울 클리어는 마스터 횟수에 포함하지 않습니다. 다른 항공사 플레이는 아직 제공하지
                    않습니다.
                </p>
            </template>
            <template v-if="dialogType === 'help'">
                <ol class="help-list">
                    <li>
                        <strong>왕복편을 선택하세요.</strong>
                        <p>보관함 또는 타임라인의 블록을 클릭하거나 키보드 Tab과 Enter로 선택합니다.</p>
                    </li>
                    <li>
                        <strong>기체를 배정하세요.</strong>
                        <p>
                            상세의 배정 기체 메뉴를 사용하거나 블록 전체를 기체 행으로 드래그합니다. 시각은
                            바뀌지 않으며 왕편과 복편은 항상 함께 이동합니다.
                        </p>
                    </li>
                    <li>
                        <strong>공항과 준비 시간을 확인하세요.</strong>
                        <p>
                            김포 GMP와 인천 ICN은 다른 공항입니다. 귀환 후 준비 45분과 현지 준비 30분은 게임
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
                            저장과 불러오기는 이 브라우저의 localStorage를 사용합니다. 한 번의 배정 변경은 한
                            번의 되돌리기로 복원됩니다. Ctrl 또는 ⌘ + Z, Shift + Z를 지원합니다. 새로고침 시
                            현재 탭의 진행도 복원합니다.
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import AppIcon from './components/AppIcon.vue';
import FlightBlock from './components/FlightBlock.vue';
import { airports, datasets, sources, tutorial } from './data/schedules';
import {
    evaluate,
    getBlocks,
    makeSave,
    parseSave,
    recordClear,
    SAVE_KEY,
    PROGRESS_KEY,
    MINUTE,
    HOUR,
} from './game';

const dataset = ref(tutorial);
const assignments = ref([]);
const repeat = ref(false);
const playId = ref(crypto.randomUUID());
const undoStack = ref([]);
const redoStack = ref([]);
const selectedId = ref(null);
const view = ref('day');
const dayIndex = ref(4);
const airportFilter = ref('all');
const dragId = ref(null);
const dragOver = ref(null);
const notice = ref('');
const storageError = ref('');
const dialog = ref(null);
const dialogType = ref('results');
const timelineSection = ref(null);
let noticeTimer;
const levels = [
    { name: '파라타항공', difficulty: '최하', note: '가상 기체 6대' },
    { name: '에어서울', difficulty: '최하', note: '가상 기체 6대 / 부분 시간표 튜토리얼' },
    { name: '에어프레미아', difficulty: '중', note: '장거리 운항 도전' },
    { name: '에어부산', difficulty: '상', note: '넓어지는 노선 네트워크' },
    { name: '진에어', difficulty: '마스터', note: '복잡한 기단 운영' },
    { name: '아시아나항공', difficulty: '실무', note: '마스터 3회 클리어 시 해금' },
];
const blocks = computed(() => getBlocks(dataset.value));
const result = computed(() => evaluate(dataset.value, assignments.value, repeat.value));
const conflicts = computed(() => result.value.issues.filter((i) => i.code !== 'unassigned'));
const unassigned = computed(() =>
    blocks.value.filter((b) => !assignments.value.some((a) => a.rotationId === b.id)),
);
const filteredUnassigned = computed(() =>
    unassigned.value.filter((b) => airportFilter.value === 'all' || b.outbound.from === airportFilter.value),
);
const selected = computed(() => blocks.value.find((b) => b.id === selectedId.value));
const days = computed(() =>
    Array.from({ length: 7 }, (_, index) => ({
        index,
        start: dataset.value.weekStart + index * 24 * HOUR,
        label: `11.${16 + index} (${['월', '화', '수', '목', '금', '토', '일'][index]})`,
    })),
);
const visibleDays = computed(() => (view.value === 'week' ? days.value : [days.value[dayIndex.value]]));
const rangeStart = computed(() => visibleDays.value[0].start);
const rangeEnd = computed(() => rangeStart.value + (view.value === 'week' ? 168 : 24) * HOUR);
const trackWidth = computed(() => (view.value === 'week' ? 4032 : 1440));
const formatDate = (value) =>
    new Intl.DateTimeFormat('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
        timeZone: 'Asia/Seoul',
    }).format(value);
const number = (value) => Math.round(value).toLocaleString('ko-KR');
const assignedPlane = (id) => assignments.value.find((a) => a.rotationId === id)?.aircraftId || '';
const loadFor = (id) => result.value.loads.find((l) => l.id === id);
const hasIssue = (id) => conflicts.value.some((i) => i.blockId === id);
const issuesForPlane = (id) => conflicts.value.some((i) => i.aircraftId === id);
function visible(b) {
    return b.start < rangeEnd.value && b.end > rangeStart.value;
}
function planeBlocks(id) {
    return blocks.value.filter((b) => assignedPlane(b.id) === id && visible(b));
}
function visibleMaintenance(id) {
    return dataset.value.maintenance.filter((m) => m.aircraftId === id && visible(m));
}
function lanesFor(id) {
    const ends = [];
    const lanes = {};
    planeBlocks(id)
        .sort((a, b) => a.start - b.start)
        .forEach((b) => {
            let lane = ends.findIndex((end) => end <= b.start);
            if (lane < 0) lane = ends.length;
            ends[lane] = b.end;
            lanes[b.id] = lane;
        });
    return lanes;
}
function laneFor(blockId, id) {
    return lanesFor(id)[blockId] || 0;
}
function rowHeight(id) {
    return 91 + Math.max(0, ...Object.values(lanesFor(id))) * 73;
}
function position(block) {
    return {
        left: `${((block.start - rangeStart.value) / (rangeEnd.value - rangeStart.value)) * 100}%`,
        width: `${((block.end - block.start) / (rangeEnd.value - rangeStart.value)) * 100}%`,
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
    assignments.value = [
        { rotationId: b[0].id, aircraftId: 'AS01' },
        { rotationId: b[1].id, aircraftId: 'AS01' },
        { rotationId: b[4].id, aircraftId: 'AS05' },
    ];
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
    toast(planeId ? `${planeId}에 왕복편을 배정했습니다.` : '왕복편을 미배정 보관함으로 옮겼습니다.');
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
function drop(event, planeId) {
    const id = event.dataTransfer.getData('text/plain');
    assign(id, planeId);
    endDrag();
}
function endDrag() {
    dragId.value = null;
    dragOver.value = null;
}
function selectBlock(id) {
    selectedId.value = id;
}
function focusSelectedDay() {
    if (!selected.value) return;
    dayIndex.value = Math.min(
        6,
        Math.max(0, Math.floor((selected.value.start - dataset.value.weekStart) / (24 * HOUR))),
    );
    view.value = 'day';
    scrollTimeline();
}
function scrollTimeline() {
    timelineSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function changeDataset(id) {
    persistSession();
    dataset.value = datasets.find((d) => d.id === id) || tutorial;
    repeat.value = false;
    playId.value = crypto.randomUUID();
    undoStack.value = [];
    redoStack.value = [];
    airportFilter.value = 'all';
    view.value = dataset.value.kind === 'fiction' ? 'week' : 'day';
    dayIndex.value = 4;
    restoreSession();
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
function keydown(event) {
    if (dialog.value?.open || /INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        event.shiftKey ? redo() : undo();
    }
}
watch(repeat, persistSession);
onMounted(() => {
    restoreSession();
    window.addEventListener('keydown', keydown);
});
onBeforeUnmount(() => {
    window.removeEventListener('keydown', keydown);
    clearTimeout(noticeTimer);
});
</script>
