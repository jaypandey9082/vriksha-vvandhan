# Public Submission Flow

## What a participant enters

The public `/join` form asks for exactly five things: a display name, an email address, one photograph, publication consent, and acceptance of the campaign terms. It does not ask for a city, phone number, age, story, location, or account login.

## How the photograph stays private

The browser reduces the photograph to a safe WebP or JPEG before upload and removes EXIF/GPS metadata. The server reserves a fixed path containing only a random submission ID and gives the browser a short-lived, non-overwriting upload token. The browser sends the prepared file directly to the private `submission-originals` bucket. The original filename, email, and display name never appear in the Storage path.

After upload, the server downloads the private object through its trusted connection and checks its real size, format, dimensions, page count, and SHA-256 hash. A submission reaches **Pending Review** only after those checks and an atomic database finalisation.

## What Pending Review means

Pending Review means the Mirchi team has received the private submission. The photograph is not yet public, the campaign count has not changed, no Guardian number exists, and no certificate has been generated.

The participant sees an on-screen confirmation explaining that approval may later add the photograph to the Movement Wall, include it in the campaign count, and make it eligible for a personalised certificate.

## What happens later

Reviewer and Admin workflows, approval, publication, Guardian-number assignment, and the live Movement Wall belong to Section 4. Section 3 creates a `submission_received` delivery placeholder for future use, but it does not connect an email provider or send any email. Certificates and delivery automation belong to Section 5.
