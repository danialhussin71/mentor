class TestSubmitElement extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        const button = document.createElement('button');
        button.id = "submitButton";
        button.name = "test-submit";
        button.textContent = "Submit";
        this.shadowRoot.appendChild(button);

        button.addEventListener('click', () => {
            // Dispatch a custom event instead of postMessage
            this.dispatchEvent(new CustomEvent('startLoadingEvent', {
                bubbles: true,
                composed: true,
                detail: { message: "startLoading" }
            }));
        });
    }
}

customElements.define('test-submit-element1', TestSubmitElement);
