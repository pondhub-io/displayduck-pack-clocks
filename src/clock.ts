import { Signal, Widget, type WidgetConfigValues, signal } from '@displayduck/base';

type ClockStyle = 'flip' | 'digital' | 'analog';
type ClockTime = { h: string; m: string; s: string };
type FlipDigitState = { current: string; next: string; flipping: boolean };

type ClockConfig = WidgetConfigValues & {
  styles?: string;
  showSeconds?: boolean;
  ledFont?: boolean;
  blinkSeparator?: boolean;
  showAllNumbers?: boolean;
  use24Hour?: boolean;
  shadow?: boolean;
};

export class DisplayDuckWidget extends Widget<ClockConfig> {
  private static readonly FLIP_DURATION_MS = 180;
  private static readonly ANALOG_REFRESH_MS = 50;

  private clockTimerId: ReturnType<typeof setTimeout> | null = null;
  private flipTimeouts = new Map<number, ReturnType<typeof setTimeout>>();
  private analogMarkerRotation = 0;
  private flipDigits: FlipDigitState[] = [];
  private previousTickActive: string[] = new Array(60).fill('');

  public readonly analogQuarterDigits = [3, 6, 9, 12];
  public readonly analogAllDigits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  public readonly analogTicks = Array.from({ length: 60 }, (_, index) => index);
  public readonly shadows: Signal<boolean> = signal(false);

  public onInit(): void {
    this.shadows.set(this.config.shadow === true);
    this.flipDigits = this.createFlipDigits(this.getCurrentTime());
    this.applyTimeToDom(this.getCurrentTime(), true);
    this.scheduleNextTick();
  }

  public onUpdate(): void {
    this.shadows.set(this.config.shadow === true);
    this.flipDigits = this.createFlipDigits(this.getCurrentTime());
    this.applyTimeToDom(this.getCurrentTime(), true);
    this.scheduleNextTick();
  }

  public onDestroy(): void {
    this.stopClock();
  }

  public shadowsEnabled(): boolean {
    return this.shadows();
  }

  public isAnalog(): boolean {
    return this.styles() === 'analog';
  }

  public isDigital(): boolean {
    return this.styles() === 'digital';
  }

  public isFlip(): boolean {
    return this.styles() === 'flip';
  }

  public styles(): ClockStyle {
    const raw = String(this.config.styles ?? '').toLowerCase();
    if (raw === 'flip' || raw === 'digital' || raw === 'analog') {
      return raw;
    }
    const name = String(this.payload['name'] ?? '').toLowerCase();
    if (name.includes('flip')) return 'flip';
    if (name.includes('analog')) return 'analog';
    if (name.includes('digital')) return 'digital';
    return 'digital';
  }

  public showSeconds(): boolean {
    return Boolean(this.config.showSeconds);
  }

  public ledFont(): boolean {
    return Boolean(this.config.ledFont);
  }

  public blinkSeparator(): boolean {
    return Boolean(this.config.blinkSeparator);
  }

  public showAllNumbers(): boolean {
    return Boolean(this.config.showAllNumbers);
  }

  public analogDigits(): number[] {
    return this.showAllNumbers() ? this.analogAllDigits : this.analogQuarterDigits;
  }

  public getTickRotation(tick: number): string {
    return `rotate(${tick * 6})`;
  }

  public getDigitTransform(digit: number): string {
    return `rotate(${digit * 30}) translate(0 -55) rotate(${-digit * 30})`;
  }

  public firstFlipPair(): number[] {
    return [0, 1];
  }

  public secondFlipPair(): number[] {
    return [2, 3];
  }

  public thirdFlipPair(): number[] {
    return [4, 5];
  }

  private scheduleNextTick(): void {
    this.stopClock();

    if (this.isAnalog()) {
      const tickAnalog = (): void => {
        const nowDate = new Date();
        this.analogMarkerRotation = (nowDate.getSeconds() + (nowDate.getMilliseconds() / 1000)) * 6;
        this.applyTimeToDom(this.getTimeForDate(nowDate), false);
        this.clockTimerId = setTimeout(tickAnalog, DisplayDuckWidget.ANALOG_REFRESH_MS);
      };
      tickAnalog();
      return;
    }

    const tick = (): void => {
      const now = Date.now();
      const leadMs = this.isFlip() ? DisplayDuckWidget.FLIP_DURATION_MS : 0;
      let delay = 1000 - (now % 1000) - leadMs;
      if (delay <= 0) delay += 1000;

      this.clockTimerId = setTimeout(() => {
        const baseNow = Date.now();
        const effectiveNow = this.isFlip() ? baseNow + DisplayDuckWidget.FLIP_DURATION_MS : baseNow;
        this.applyTimeToDom(this.getTimeForDate(new Date(effectiveNow)), false);
        tick();
      }, delay);
    };

    tick();
  }

  private stopClock(): void {
    if (this.clockTimerId) {
      clearTimeout(this.clockTimerId);
      this.clockTimerId = null;
    }
    for (const timeout of this.flipTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.flipTimeouts.clear();
  }

  private applyTimeToDom(time: ClockTime, forceInstantFlip: boolean): void {
    this.applyDigital(time);
    this.applyAnalog(time);
    this.applyFlip(time, forceInstantFlip);
  }

  private applyDigital(time: ClockTime): void {
    if (!this.isDigital()) return;
    this.dom.query('[data-clock-hour]').setText(time.h);
    this.dom.query('[data-clock-minute]').setText(time.m);
    if (this.showSeconds()) {
      this.dom.query('[data-clock-second]').setText(time.s);
    }
  }

  private applyAnalog(time: ClockTime): void {
    if (!this.isAnalog()) return;

    const hourRotation = this.getAnalogHourRotation(time);
    const minuteRotation = this.getAnalogMinuteRotation(time);
    this.dom.query('[data-analog-hour]').setAttribute('transform', `rotate(${hourRotation})`);
    this.dom.query('[data-analog-minute]').setAttribute('transform', `rotate(${minuteRotation})`);

    if (this.showSeconds()) {
      this.dom.query('[data-analog-marker]').setAttribute(
        'transform',
        `rotate(${this.analogMarkerRotation - 3} 0 0)`,
      );
    }

    // Only write ticks whose active state actually changed -- most of the
    // 60 ticks stay far from the marker at any given moment, and this runs
    // every 50ms; writing all 60 unconditionally would be a lot of
    // unnecessary postMessage traffic for a mostly-unchanged ring.
    for (let index = 0; index < this.analogTicks.length; index += 1) {
      const nextValue = this.showSeconds()
        ? (() => {
          const distance = this.getAnalogTickDistance(index);
          return distance >= 0 ? String(distance) : '';
        })()
        : '';
      if (this.previousTickActive[index] === nextValue) {
        continue;
      }
      this.previousTickActive[index] = nextValue;
      this.dom.query(`[data-analog-tick="${index}"]`).setAttribute('data-active', nextValue);
    }
  }

  private applyFlip(time: ClockTime, forceInstant: boolean): void {
    if (!this.isFlip()) return;
    const nextDigits = `${time.h}${time.m}${time.s}`.split('');

    for (let index = 0; index < nextDigits.length; index += 1) {
      const current = this.flipDigits[index] ?? { current: '0', next: '0', flipping: false };
      const next = nextDigits[index] ?? '0';

      const pending = this.flipTimeouts.get(index);
      if (pending) {
        clearTimeout(pending);
        this.flipTimeouts.delete(index);
      }

      if (forceInstant || current.current === next) {
        current.current = next;
        current.next = next;
        current.flipping = false;
        this.flipDigits[index] = current;
        this.renderFlipDigit(index);
        continue;
      }

      current.next = next;
      current.flipping = true;
      this.flipDigits[index] = current;
      this.renderFlipDigit(index);

      const timeout = setTimeout(() => {
        const state = this.flipDigits[index];
        if (!state) return;
        state.current = state.next;
        state.flipping = false;
        this.flipDigits[index] = state;
        this.renderFlipDigit(index);
        this.flipTimeouts.delete(index);
      }, DisplayDuckWidget.FLIP_DURATION_MS);

      this.flipTimeouts.set(index, timeout);
    }
  }

  private renderFlipDigit(index: number): void {
    const state = this.flipDigits[index];
    if (!state) return;

    const digitSelector = `[data-flip-index="${index}"]`;
    this.dom.query(digitSelector).toggleClass('flipping', state.flipping);
    this.dom.query(`${digitSelector} .digit-full`).setText(state.current);
    this.dom.query(`${digitSelector} .digit-static.top .value`).setText(state.flipping ? state.next : state.current);
    this.dom.query(`${digitSelector} .digit-static.bottom .value`).setText(state.current);
    this.dom.query(`${digitSelector} .digit-flip.top .value`).setText(state.current);
    this.dom.query(`${digitSelector} .digit-flip.bottom .value`).setText(state.next);
  }

  private getAnalogHourRotation(time: ClockTime): number {
    const hours = Number(time.h) % 12;
    const minutes = Number(time.m);
    return (hours + (minutes / 60)) * 30;
  }

  private getAnalogMinuteRotation(time: ClockTime): number {
    const minutes = Number(time.m);
    const seconds = Number(time.s);
    return (minutes + (seconds / 60)) * 6;
  }

  private getAnalogTickDistance(tick: number): number {
    const markerTick = ((Math.round(this.analogMarkerRotation / 6) % 60) + 60) % 60;
    if (!Number.isFinite(markerTick)) return -1;
    const distance = (markerTick - tick + 60) % 60;
    return distance <= 4 ? distance : -1;
  }

  private getCurrentTime(): ClockTime {
    return this.getTimeForDate(new Date());
  }

  private getTimeForDate(now: Date): ClockTime {
    const use24Hour = this.config.use24Hour === undefined ? true : Boolean(this.config.use24Hour);
    let hours = now.getHours();
    if (!use24Hour) {
      hours = hours % 12 || 12;
    }
    return {
      h: String(hours).padStart(2, '0'),
      m: String(now.getMinutes()).padStart(2, '0'),
      s: String(now.getSeconds()).padStart(2, '0'),
    };
  }

  private createFlipDigits(time: ClockTime): FlipDigitState[] {
    return `${time.h}${time.m}${time.s}`.split('').map((digit) => ({
      current: digit,
      next: digit,
      flipping: false,
    }));
  }
}
