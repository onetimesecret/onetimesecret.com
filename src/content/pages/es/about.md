---
title: Acerca de Nosotros
---

<article class="prose dark:prose-invert md:prose-lg lg:prose-xl">
  <h2>
    Acerca de Nosotros
  </h2>

  <p>
    Hola, soy Delano, el creador de Onetime Secret. Lo que comenzó en 2012 como una forma simple y segura de compartir información sensible ha crecido más allá de nuestras expectativas más descabelladas. Más de una década después, estamos facilitando el intercambio seguro de millones de secretos mensualmente, con casos de uso que nunca imaginamos.
  </p>

  <p>
    La primera mitad de 2024 ha sido nuestro período más ocupado hasta ahora. Agradecemos que la gente haya seguido usando y compartiendo nuestro producto durante más de una década. Actualmente estamos trabajando en mejoras que creemos que harán el servicio aún más útil; compartiremos más detalles pronto.
  </p>

  <p>
    Fieles a nuestras raíces, <a href="https://github.com/onetimesecret/onetimesecret">our code remains open-source</a> en GitHub. Mientras navegamos por el panorama cambiante de la privacidad y seguridad digital, estamos comprometidos con la transparencia y la mejora continua.
  </p>

  <p>
    Gracias por ser parte de nuestro viaje. Brindemos por otra década de intercambio seguro y efímero.
  </p>

  <p>
    Si tienes alguna pregunta, hay un formulario de comentarios en la parte inferior de (casi) todas las páginas.
  </p>

  <p>
    Feliz intercambio,
Delano
  </p>

  <p style="margin-left: 40%; margin-right: 40%">
    <a
      href="https://delanotes.com/"
      title="Delano Mandelbaum"><img
        src="/public/etc/img/delano-g.png"
        width="95"
        height="120"
        border="0"
      /></a>
  </p>

  <h3>F.A.Q.</h3>

  <h4>¿Por qué usaría esto?</h4>
  <p>
    Cuando envías contraseñas y enlaces privados a personas por correo electrónico o chat, hay copias de esa información almacenadas en muchos lugares. Si usas un enlace de Onetime en su lugar, la información persiste para una sola visualización, lo que significa que no puede ser leída por otra persona más tarde. Esto te permite enviar información sensible de forma segura sabiendo que solo la ve una persona. Piénsalo como un mensaje autodestructivo.
  </p>

  <h4>¿Por qué no puedo enviar imágenes u otros tipos de archivos?</h4>
  <p>
    Nuestro servicio está diseñado específicamente para secretos basados en texto para garantizar la máxima seguridad y simplicidad. Los archivos, especialmente las imágenes, pueden contener metadatos que podrían revelar involuntariamente información sobre el remitente o el destinatario. Al centrarnos en el texto, podemos garantizar que no se transmitan datos adicionales más allá de lo que escribes explícitamente. Si necesitas compartir un archivo de forma segura, te recomendamos utilizar un servicio dedicado de transferencia segura de archivos. Podríamos considerar agregar soporte para archivos en el futuro si existen casos de uso convincentes para ello.
  </p>

  <h4>Pero puedo copiar el texto secreto. ¿Cuál es la diferencia?</h4>
  <p>
    Cierto, pero todo lo que tienes es texto. Las imágenes y otros tipos de archivos pueden contener metadatos y otra información potencialmente reveladora sobre el remitente o el destinatario. Nuevamente, esto es simplemente para garantizar que no se comparta información privada fuera del destinatario previsto.
  </p>

  <h4>¿Puedo recuperar un secreto que ya ha sido compartido?</h4>
  <p>
    No. Lo mostramos una vez y luego lo eliminamos. Después de eso, desaparece para siempre.
  </p>

  <h4>¿Cuál es la diferencia entre el uso anónimo y tener una cuenta gratuita?</h4>
  <p>
    Los usuarios anónimos pueden crear secretos que duran hasta 7 días y tienen un tamaño máximo de 100 KB. Los titulares de cuentas gratuitas obtienen beneficios extendidos: los secretos pueden durar hasta 14 días y pueden tener un tamaño de hasta 1000 KB. Los titulares de cuentas también tienen acceso a funciones adicionales como opciones de destruir antes de leer, que permiten a los remitentes eliminar secretos antes de que sean recibidos.
  </p>

  <h4>¿Cómo manejan las solicitudes de datos de las fuerzas del orden u otros terceros?</h4>
  <p>
    Fieles a nuestras raíces, <a href="https://github.com/onetimesecret/onetimesecret">our code remains open-source</a> en GitHub. Mientras navegamos por el panorama cambiante de la privacidad y seguridad digital, estamos comprometidos con la transparencia y la mejora continua.
  </p>
  <p>
    Diseñamos nuestro sistema pensando en la privacidad. No almacenamos secretos después de que han sido vistos y no guardamos registros de acceso más allá del mínimo necesario. Esto significa que, en la mayoría de los casos, simplemente no tenemos datos para proporcionar en respuesta a tales solicitudes. Para obtener más detalles, revisa nuestra <a href="/privacy">privacy policy</a>.
  </p>

  <h4>¿Por qué debería confiar en ustedes?</h4>
  <p>
    Hemos diseñado nuestro sistema con la privacidad y la seguridad como principales prioridades. He aquí por qué puedes confiar en nosotros:
  </p>
  <ul>
    <li>No podemos acceder a tu información aunque quisiéramos (y no queremos). Por ejemplo, si compartes una contraseña, no sabemos el nombre de usuario ni siquiera la aplicación para la que es.</li>
    <li>Si usas una frase de contraseña (disponible en "Opciones de Privacidad"), la incluimos en la clave de cifrado del secreto. Solo almacenamos un hash bcrypt de la frase de contraseña, lo que nos imposibilita descifrar tu secreto una vez guardado.</li>
    <li>Nuestro código es <a href="https://github.com/onetimesecret/onetimesecret">open source</a>. Puedes revisarlo tú mismo o incluso ejecutar tu propia instancia si lo prefieres.</li>
    <li>Utilizamos prácticas de seguridad estándar de la industria, incluyendo HTTPS para todas las conexiones y cifrado en reposo para los datos almacenados.</li>
  </ul>

  <h4>¿Cómo funciona la opción de frase de contraseña?</h4>
  <p>
    Cuando usas una frase de contraseña, ciframos tu secreto en nuestros servidores usando la frase de contraseña que proporcionas. No almacenamos la frase de contraseña en sí, solo un hash bcrypt de ella. Este hash se usa para verificar la frase de contraseña cuando el destinatario la introduce. He aquí por qué esto es seguro:
  </p>
  <ul>
    <li>Nunca almacenamos el secreto sin cifrar ni la frase de contraseña.</li>
    <li>El hash bcrypt no se puede usar para descifrar el secreto.</li>
    <li>Sin la frase de contraseña original, el secreto cifrado no se puede descifrar, ni siquiera por nosotros.</li>
    <li>Esto significa que incluso si nuestros servidores fueran comprometidos, tu secreto permanecería seguro siempre que la frase de contraseña permanezca desconocida.</li>
  </ul>
  <p>
    Recuerda, la seguridad de tu secreto depende de la fortaleza de tu frase de contraseña y de cuán seguramente la comuniques al destinatario.
  </p>
</article>
