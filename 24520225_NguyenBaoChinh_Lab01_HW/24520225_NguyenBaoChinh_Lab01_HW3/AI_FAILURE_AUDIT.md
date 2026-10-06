# AI Failure Mode Audit

## Project: HW3 - Resilient Landing Page

This report documents three AI-induced defects identified during the implementation and review of the HW3 landing page. Each defect was diagnosed through source-code inspection and browser testing, then corrected using a cleaner engineering solution.

---

## Defect 1: Duplicate Countdown Element ID

### 1. Defect Description

The AI-generated HTML accidentally created two elements with the same `id="countdown"`.

The duplicated structure looked like this:

```html
<div
    id="countdown"
    aria-live="polite"
    aria-label="Countdown timer"
>
    Loading...
</div>

<div
    id="countdown"
    aria-live="polite"
    aria-label="Countdown timer"
>
    Loading...
</div>
```

An HTML `id` should identify one unique element. Having duplicate IDs can cause JavaScript DOM queries such as `document.getElementById("countdown")` to target only one of the elements and can produce unpredictable or confusing behavior.

### 2. Diagnostic Method

The defect was identified by manually inspecting the HTML structure in VS Code.

The following checks were performed:

- Search for `id="countdown"` in `index.html`.
- Verify that the countdown element exists only once.
- Run the page in the browser and inspect the DOM using browser Developer Tools.
- Check that the JavaScript correctly selects the intended countdown element.

### 3. Refactored Solution

The duplicate countdown element was removed so that only one countdown element remains:

```html
<div
    id="countdown"
    aria-live="polite"
    aria-label="Countdown timer"
>
    Loading...
</div>
```

The JavaScript can then safely use:

```javascript
const countdownElement = document.getElementById("countdown");
```

This creates a clear one-to-one relationship between the HTML element and the JavaScript reference.

---

## Defect 2: Duplicated and Incorrectly Placed Form/Section Markup

### 1. Defect Description

The AI-generated HTML was accidentally assembled by appending new form and hero sections after the closing `</html>` tag while an earlier version of the same content was still present.

This produced duplicated markup and invalid document structure.

For example, the file contained content after:

```html
</html>
```

and another `<section class="hero">` was added afterward.

This could result in inconsistent browser DOM parsing and made the page structure difficult to maintain.

### 2. Diagnostic Method

The defect was identified through HTML source-code inspection and browser testing.

The document was checked for:

- More than one hero section containing the same content.
- More than one form with the same `id`.
- Elements placed after the closing `</html>` tag.
- Duplicate IDs such as `signup-form`, `email`, and `form-status`.

The browser Developer Tools DOM inspector was also used to verify how the browser interpreted the invalid structure.

### 3. Refactored Solution

The HTML was reorganized into one valid document structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HW3 Resilient Landing Page</title>
    <link rel="stylesheet" href="style.css">
</head>

<body>
    <main>
        <section class="hero">

            <h1>Coming Soon</h1>

            <p>
                Our new production experience is launching soon.
            </p>

            <div
                id="countdown"
                aria-live="polite"
                aria-label="Countdown timer"
            >
                Loading...
            </div>

            <form id="signup-form">

                <label for="email">
                    Email
                </label>

                <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                >

                <button
                    id="submit-button"
                    type="submit"
                >
                    Notify Me
                </button>

                <p
                    id="form-status"
                    aria-live="polite"
                ></p>

            </form>

        </section>
    </main>

    <script src="app.js"></script>
</body>
</html>
```

The final document contains one hero section, one form, and unique IDs.

---

## Defect 3: Missing Double-Submit Protection

### 1. Defect Description

The initial AI-assisted form implementation handled the asynchronous submission process but did not initially include an explicit guard against a second submit event while the first request was still running.

Because the simulated request takes several seconds, a user could attempt to submit the form again before the first request completed.

This could create duplicate requests in a real application.

### 2. Diagnostic Method

The defect was identified through source-code inspection and rapid browser interaction testing.

The form was tested by:

1. Entering a valid email address.
2. Clicking `Notify Me`.
3. Attempting to submit the form again while the first request was still in the `SUBMITTING` state.
4. Inspecting the JavaScript event handler to determine whether repeated submit events were explicitly rejected.

### 3. Refactored Solution

A state guard was added at the beginning of the submit handler:

```javascript
if (currentState === FORM_STATES.SUBMITTING) {
    return;
}
```

The submit button is also disabled while the request is running:

```javascript
case FORM_STATES.SUBMITTING:
    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";
    formStatus.textContent = "Submitting your request...";
    break;
```

The resulting state machine is:

```text
IDLE
  |
  | Submit
  v
SUBMITTING
  |
  +------> SUCCESS
  |
  +------> ERROR
```

While the form is in the `SUBMITTING` state, additional submit attempts are ignored.

This provides both UI-level and logic-level protection against duplicate submissions.

---

