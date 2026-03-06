---
title: Acerca de Nosotros

---

Hola, soy Delano, el creador de Onetime Secret. Lo que comenzó en 2012 como una forma sencilla y segura de compartir información sensible ha evolucionado mucho más allá de la visión inicial. Más de una década después, estamos de lleno en el negocio de los "secretos", atendiendo casos de uso que nunca imaginé.

## Lo que hemos construido

A lo largo de los años, hemos pasado de ser una herramienta sencilla a un servicio enfocado en compartir información sensible:
- [Dominios personalizados y marca propia](https://docs.onetimesecret.com/en/custom-domains/) para equipos y empresas
- Múltiples regiones, incluyendo [EE. UU.](https://us.onetimesecret.com), [Canadá](https://ca.onetimesecret.com) y [Aotearoa Nueva Zelanda](https://nz.onetimesecret.com)
- Planes de suscripción que convirtieron un hobby de larga duración en un negocio sostenible
- Lanzamientos regulares en [GitHub](https://github.com/onetimesecret/onetimesecret/releases)

## Nuestro enfoque

Nos mantenemos fieles a los [principios fundamentales](https://docs.onetimesecret.com/en/principles/) con los que empezamos. [Nuestro código es open-source](https://github.com/onetimesecret/onetimesecret) porque creemos en la transparencia, la participación de la comunidad y compartir cosas buenas.

A medida que evolucionan la privacidad digital y los desafíos de internet, nosotros también lo hacemos: ajustando la seguridad, haciendo las cosas más fáciles de usar y asegurándonos de que nuestro servicio funcione bien para todos los que lo necesitan.

> ¿Sabías que? En 2011, Drew Carey sugirió que "One Time Secret" sería un [buen nombre para una banda](https://x.com/DrewFromTV/status/142730130689761280). Lo que perdió la industria musical lo ganó internet.

## El buzón de sugerencias

¿Tienes preguntas o ideas? Hay un [formulario de comentarios](/feedback) en la parte inferior de (casi) todas las páginas.

Feliz intercambio,
Delano

<img src="/etc/img/delano-g.png" alt="Delano" width="95" height="120" />

---



## F.A.Q.

### ¿Por qué usaría esto?

Cuando envías contraseñas y enlaces privados a personas por correo electrónico o chat, hay copias de esa información almacenadas en muchos lugares. Si usas un enlace de Onetime en su lugar, la información persiste para una sola visualización, lo que significa que no puede ser leída por otra persona más tarde. Esto te permite enviar información sensible de forma segura sabiendo que solo la ve una persona. Piénsalo como un mensaje autodestructivo.

### ¿Por qué no puedo enviar imágenes u otros tipos de archivos?

Nuestro servicio está diseñado específicamente para secretos basados en texto para garantizar la máxima seguridad y simplicidad. Los archivos, especialmente las imágenes, pueden contener metadatos que podrían revelar involuntariamente información sobre el remitente o el destinatario. Al centrarnos en el texto, podemos garantizar que no se transmitan datos adicionales más allá de lo que escribes explícitamente. Si necesitas compartir un archivo de forma segura, te recomendamos utilizar un servicio dedicado de transferencia segura de archivos. Podríamos considerar agregar soporte para archivos en el futuro si existen casos de uso convincentes para ello.

### Pero puedo copiar el texto secreto. ¿Cuál es la diferencia?

Cierto, pero todo lo que tienes es texto. Las imágenes y otros tipos de archivos pueden contener metadatos y otra información potencialmente reveladora sobre el remitente o el destinatario. Nuevamente, esto es simplemente para garantizar que no se comparta información privada fuera del destinatario previsto.

### ¿Puedo recuperar un secreto que ya ha sido compartido?

No. Lo mostramos una vez y luego lo eliminamos. Después de eso, desaparece para siempre.

### ¿Cuál es la diferencia entre el uso anónimo y tener una cuenta gratuita?

Los usuarios anónimos pueden crear secretos que duran hasta 7 días y tienen un tamaño máximo de 100 KB. Los titulares de cuentas gratuitas obtienen beneficios extendidos: los secretos pueden durar hasta 14 días y pueden tener un tamaño de hasta 1000 KB. Los titulares de cuentas también tienen acceso a funciones adicionales como opciones de destruir antes de leer, que permiten a los remitentes eliminar secretos antes de que sean recibidos.

### ¿Cómo manejan las solicitudes de datos de las fuerzas del orden u otros terceros?

Fieles a nuestras raíces, [nuestro código sigue siendo open-source](https://github.com/onetimesecret/onetimesecret) en GitHub. Mientras navegamos por el panorama cambiante de la privacidad y seguridad digital, estamos comprometidos con la transparencia y la mejora continua.

Diseñamos nuestro sistema pensando en la privacidad. No almacenamos secretos después de que han sido vistos y no guardamos registros de acceso más allá del mínimo necesario. Esto significa que, en la mayoría de los casos, simplemente no tenemos datos para proporcionar en respuesta a tales solicitudes. Para obtener más detalles, revisa nuestra [política de privacidad](/privacy).

### ¿Por qué debería confiar en ustedes?

Hemos diseñado nuestro sistema con la privacidad y la seguridad como principales prioridades. He aquí por qué puedes confiar en nosotros:

- No podemos acceder a tu información aunque quisiéramos (y no queremos). Por ejemplo, si compartes una contraseña, no sabemos el nombre de usuario ni siquiera la aplicación para la que es.
- Si usas una frase de contraseña (disponible en "Opciones de Privacidad"), la incluimos en la clave de cifrado del secreto. Solo almacenamos un hash bcrypt de la frase de contraseña, lo que nos imposibilita descifrar tu secreto una vez guardado.
- Nuestro código es [open source](https://github.com/onetimesecret/onetimesecret). Puedes revisarlo tú mismo o incluso ejecutar tu propia instancia si lo prefieres.
- Utilizamos prácticas de seguridad estándar de la industria, incluyendo HTTPS para todas las conexiones y cifrado en reposo para los datos almacenados.

### ¿Cómo funciona la opción de frase de contraseña?

Cuando usas una frase de contraseña, ciframos tu secreto en nuestros servidores usando la frase de contraseña que proporcionas. No almacenamos la frase de contraseña en sí, solo un hash bcrypt de ella. Este hash se usa para verificar la frase de contraseña cuando el destinatario la introduce. He aquí por qué esto es seguro:

- Nunca almacenamos el secreto sin cifrar ni la frase de contraseña.
- El hash bcrypt no se puede usar para descifrar el secreto.
- Sin la frase de contraseña original, el secreto cifrado no se puede descifrar, ni siquiera por nosotros.
- Esto significa que incluso si nuestros servidores fueran comprometidos, tu secreto permanecería seguro siempre que la frase de contraseña permanezca desconocida.

> **Recuerda**: La seguridad de tu secreto depende de la fortaleza de tu frase de contraseña y de cuán seguramente la comuniques al destinatario.
