# EARS Syntax Rules for Architecture
When generating, completing, or reviewing text in files ending in `.ears.md`, you MUST strictly adhere to the Easy Approach to Requirements Syntax (EARS).

Do not output standard conversational text. Only output requirements using one of these 5 exact structures:
1. Ubiquitous: The <system> shall <response>
2. State-Driven: While <state>, the <system> shall <response>
3. Event-Driven: When <trigger>, the <system> shall <response>
4. Option-Driven: Where <feature>, the <system> shall <response>
5. Unwanted: If <unwanted trigger>, then the <system> shall <response>

If I write a messy, unstructured paragraph, suggest a rewrite that extracts my logic into one or more of these 5 strict archetypes.