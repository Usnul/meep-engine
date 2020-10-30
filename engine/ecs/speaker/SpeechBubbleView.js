import EmptyView from "../../../view/elements/EmptyView.js";

export class SpeechBubbleView extends EmptyView {
    constructor() {
        super({
            classList: ['gui-voice-speech-bubble']
        });

        this.addChild(new EmptyView({ classList: ['pointy-speech-tail'] }))
    }
}
