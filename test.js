// Define the custom element class
class TestSubmitElement extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Create a button element within the shadow DOM
        const button = document.createElement('button');
        button.id = "submitButton";
        button.name = "test-submit";
        button.textContent = "Submit";

        // Append button to the shadow DOM
        this.shadowRoot.appendChild(button);

        // Set up an event listener for the button
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

// Define the custom element with the tag name "test-submit-element"
customElements.define('test-submit-element2', TestSubmitElement);
