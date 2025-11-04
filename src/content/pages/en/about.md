---
title: About Us

---

Hi, I'm Delano, the creator of Onetime Secret. What began in 2012 as a straightforward, secure way to share sensitive information has evolved far beyond the initial vision. More than a decade later, we're fully in the "secrets" service business, serving use cases I never imagined.

## Recent History

2024 was our biggest year yet by a slim margin (we had a week-long DDoS attack that also set us back in search results). Better yet, it marked a turning point for us in the numbers game: August 2024 saw the introduction of our first subscription offerings, turning a neat hobby into a fledgling business (we call them goslings in Canada).

This past year we've been on an incredible development streak:
- Released 8 major versions from  [0.12](https://github.com/onetimesecret/onetimesecret/releases/tag/v0.12.0) -> [0.19](https://github.com/onetimesecret/onetimesecret/releases/tag/v0.19.0)
- Introduced [custom domains and branding](https://docs.onetimesecret.com/en/custom-domains/)
- Launched in multiple regions, including [US](https://us.onetimesecret.com), [Canada](https://ca.onetimesecret.com), and [Aotearoa New Zealand](https://nz.onetimesecret.com)
- Published [20+ articles](https://blog.onetimesecret.com/) on our blog (with AI-generated artwork that's been an interesting experiment)

## Moving Forward

It's 2025, and we're still sticking to the [core principles](https://docs.onetimesecret.com/en/principles/) that got us started. [Our code is open-source](https://github.com/onetimesecret/onetimesecret) because we believe in transparency, community input, and sharing good stuff.

As digital privacy and internet challenges evolve, so do we – tweaking security, making things easier to use, and ensuring our service works well for everyone who needs it.

Here's to another year of helping people share secrets safely.

> Did you know? Back in 2011, Drew Carey suggested that "One Time Secret" would make a [good band name](https://x.com/DrewFromTV/status/142730130689761280). The music industry's loss was the internet's gain.

## The Suggestion Box

Got questions or ideas? There's a [feedback form](/feedback) at the bottom of (almost) every page.

Happy sharing,
Delano

<img src="@/assets/img/delano-g.png" alt="Delano" width="95" height="120" />

---




## F.A.Q.

### Why would I use this?

When you send people passwords and private links via email or chat, there are copies of that information stored in many places. If you use a Onetime link instead, the information persists for a single viewing which means it can't be read by someone else later. This allows you to send sensitive information in a safe way knowing it's seen by one person only. Think of it like a self-destructing message.

### Why can't I send pictures or other kinds of files?

Our service is designed specifically for text-based secrets to ensure maximum security and simplicity. Files, especially images, can contain metadata that might unintentionally reveal information about the sender or recipient. By focusing on text, we can guarantee that no additional data is transmitted beyond what you explicitly type. If you need to share a file securely, we recommend using a dedicated secure file transfer service. We may consider adding support for files in the future if there are compelling use cases for it.

### But I can copy the secret text. What's the difference?

True, but all you have is text. Images and other file types can contain metadata and other potentially revealing information about the sender or recipient. Again, this is simply to ensure that no private information is shared outside of the intended recipient.

### Can I retrieve a secret that has already been shared?

Nope. We display it once and then delete it. After that, it's gone forever.

### What's the difference between anonymous use and having a free account?

Anonymous users can create secrets that last up to 7 days and have a maximum size of 100 KB. Free account holders get extended benefits: secrets can last up to 14 days and can be up to 1000 KB in size. Account holders also get access to additional features like burn-before-reading options, which allow senders to delete secrets before they're received.

### How do you handle data requests from law enforcement or other third parties?

True to our roots, [our code remains open-source](https://github.com/onetimesecret/onetimesecret) on GitHub. As we navigate the evolving landscape of digital privacy and security, we're committed to transparency and continual improvement.

We designed our system with privacy in mind. We don't store secrets after they've been viewed, and we don't keep access logs beyond the minimum necessary. This means that in most cases, we simply don't have any data to provide in response to such requests. For more details, please review our [privacy policy](/privacy).

### Why should I trust you?

We've designed our system with privacy and security as top priorities. Here's why you can trust us:

- We can't access your information even if we wanted to (which we don't). For example, if you share a password, we don't know the username or even the application it's for.
- If you use a passphrase (available under "Privacy Options"), we include that in the encryption key for the secret. We only store a bcrypt hash of the passphrase, making it impossible for us to decrypt your secret once it's saved.
- Our code is [open source](https://github.com/onetimesecret/onetimesecret). You can review it yourself or even run your own instance if you prefer.
- We use industry-standard security practices, including HTTPS for all connections and encryption at rest for stored data.

### How does the passphrase option work?

When you use a passphrase, we encrypt your secret on our servers using the passphrase you provide. We don't store the passphrase itself, only a bcrypt hash of it. This hash is used to verify the passphrase when the recipient enters it. Here's why this is secure:

- We never store the unencrypted secret or the passphrase.
- The bcrypt hash cannot be used to decrypt the secret.
- Without the original passphrase, the encrypted secret cannot be decrypted, even by us.
- This means that even if our servers were compromised, your secret would remain secure as long as the passphrase remains unknown.

> **Remember**: The security of your secret depends on the strength of your passphrase and how securely you communicate it to the recipient.
