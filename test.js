<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PostMessage Example</title>
</head>
<body>
    <button id="submitButton">Submit</button>

    <script>
        // Function to send a postMessage when the button is clicked
        document.getElementById("submitButton").addEventListener("click", function() {
            // Sending a postMessage with "startLoading" as the message content
            window.parent.postMessage("startLoading", "*");
        });
    </script>
</body>
</html>
