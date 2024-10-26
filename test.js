class TestSubmitElement extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        const button = document.createElement('button');
        button.id = "submitButton";
        button.name = "test-submit";
        button.textContent = "Submit";

        this.shadowRoot.appendChild(button);

        // Log when the button is added and the event listener is set
        console.log("Button added to custom element");

        button.addEventListener('click', () => {
            try {
                console.log("Button clicked, dispatching startLoadingEvent");
                this.dispatchEvent(new CustomEvent('startLoadingEvent', {
                    bubbles: true,
                    composed: true,
                    detail: { message: "startLoading" }
                }));
                console.log("startLoadingEvent dispatched successfully");
            } catch (error) {
                console.error("Error dispatching startLoadingEvent:", error);
            }
        });
    }
}

customElements.define('test-submit-element3', TestSubmitElement);
