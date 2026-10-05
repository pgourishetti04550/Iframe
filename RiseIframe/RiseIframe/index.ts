import { IInputs, IOutputs } from "./generated/ManifestTypes";

export class RiseIframe implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private _container: HTMLDivElement;
    private _iframe: HTMLIFrameElement;
    private _notifyOutputChanged: () => void;
    private _currentUrl = "";
    private _GPLastClickedPage = "";
    private _onMessageBound: (event: MessageEvent) => void;

    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): void {
        this._container = container;
        this._notifyOutputChanged = notifyOutputChanged;

        this._container.style.width = "100%";
        this._container.style.height = "100%";

        this._iframe = document.createElement("iframe");
        this._iframe.style.cssText = "width:100%;height:100%;border:none;";

        const url = context.parameters.template?.raw;
        if (url) {
            this._currentUrl = url;
            this._iframe.src = url;
        }
        this._container.appendChild(this._iframe);

        this._onMessageBound = this.onMessageReceived.bind(this);
        window.addEventListener("message", this._onMessageBound);
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        const url = context.parameters.template?.raw;
        if (url && url !== this._currentUrl) {
            this._currentUrl = url;
            this._iframe.src = url;
        }
    }

    private isFromOurIframe(source: MessageEventSource | null): boolean {
        const ours = this._iframe.contentWindow;
        if (!source || !ours) return false;

        let w: Window = source as Window;
        for (let i = 0; i < 6; i++) {
            if (w === ours) return true;
            if (w.parent === w) break;
            w = w.parent;
        }
        return false;
    }

    private onMessageReceived(event: MessageEvent): void {
        if (typeof event.data !== "string" || event.data.indexOf("|") === -1) return;
        if (!this.isFromOurIframe(event.source)) return;
        if (!/^[\w-]+\|\d+$/.test(event.data)) return;

        this._GPLastClickedPage = event.data;
        this._notifyOutputChanged();
    }

    public getOutputs(): IOutputs {
        return { GP_lastClickedPage: this._GPLastClickedPage };
    }

    public destroy(): void {
        window.removeEventListener("message", this._onMessageBound);
    }
}