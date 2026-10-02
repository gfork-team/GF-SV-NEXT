/**
 * 全局轻量 UI 状态：Snackbar + 安装引导对话框。
 *
 * 放模块级 state 而不是逐层透传 props，因为它们需要被
 * ScriptCard / InstallButton / 详情页 等多处触发，宿主统一挂在布局层。
 */

export interface SnackbarAction {
	label: string;
	onAction?: () => void;
	href?: string;
}

export interface SnackbarState {
	message: string;
	action?: SnackbarAction;
	timeout: number;
}

export interface InstallGuideState {
	scriptName?: string;
	/** 直装用的 .user.js 链接（走本站 /l 中转，保持加速与 .user.js 后缀） */
	installHref?: string;
}

let snackbar = $state<SnackbarState | null>(null);
let installGuide = $state<InstallGuideState | null>(null);
let dismissTimer: ReturnType<typeof setTimeout> | undefined;

export function getSnackbar(): SnackbarState | null {
	return snackbar;
}

export function showSnackbar(message: string, action?: SnackbarAction, timeout = 6000): void {
	snackbar = { message, action, timeout };
	if (dismissTimer) clearTimeout(dismissTimer);
	if (timeout > 0) {
		dismissTimer = setTimeout(() => {
			snackbar = null;
		}, timeout);
	}
}

export function dismissSnackbar(): void {
	if (dismissTimer) clearTimeout(dismissTimer);
	snackbar = null;
}

export function getInstallGuide(): InstallGuideState | null {
	return installGuide;
}

export function openInstallGuide(state: InstallGuideState = {}): void {
	installGuide = state;
}

export function closeInstallGuide(): void {
	installGuide = null;
}
