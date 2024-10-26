class TestSubmitElement extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        const button = document.createElement('button');
        button.id = "submitButton";
        button.name = "test-submit";
        button.textContent = "Submit";
        this.shadowRoot.appendChild(button);

        console.log("Button initialized in custom element");

        // Add event listener for button click
        button.addEventListener('click', () => {
            console.log("Button clicked, preparing to dispatch startLoadingEvent");

            // Dispatch the custom event
            try {
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

customElements.define('test-submit-element4', TestSubmitElement);
