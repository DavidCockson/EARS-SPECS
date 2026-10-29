# Authentication System

## Ubiquitous

[STABLE] #Ubiquitous The system shall <log all authentication attempts>.

## State-Driven

[DRAFT] #State-Driven While <session is active>, the system shall <refresh the token every 5 minutes>.

## Event-Driven

[STABLE] #Event-Driven When <token expires>, the system shall <force logout>.
[DRAFT] #Event-Driven When <user clicks login>, the system shall <authenticate the credentials>.
[DRAFT] #Event-Driven When <user requests a password reset>, the system shall <email a single-use reset link>.

## Option-Driven

[STABLE] #Option-Driven Where <two-factor is enabled>, the system shall <require a one-time code>.

## Unwanted

[DRAFT] #Unwanted If <login fails three times>, then the system shall <lock the account>.
