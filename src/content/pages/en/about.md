---
title: About Us
layout: MarkdownLayout
---

# About Us

Hi, I'm Delano, the creator of Onetime Secret. What started in 2012 as a simple, secure way to share sensitive information has grown beyond our wildest expectations. Over a decade later, we're facilitating the secure sharing of millions of secrets monthly, with use cases we never imagined.

The first half of 2024 has been our busiest period yet. We're grateful that people have continued to use and share our product for more than a decade. We're currently working on improvements that we think will make the service even more useful — we'll share more details soon.

True to our roots, [our code remains open-source](https://github.com/onetimesecret/onetimesecret) on GitHub. As we navigate the evolving landscape of digital privacy and security, we're committed to transparency and continual improvement.

Thank you for being part of our journey. Here's to another decade of secure, ephemeral sharing.

If you have any questions, there is a feedback form at the bottom of (almost) every page.

---

Happy sharing,
Delano

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
