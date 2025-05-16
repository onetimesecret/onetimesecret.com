---
title: Sobre Nós
---

<article class="prose dark:prose-invert md:prose-lg lg:prose-xl">
  <h2>
    Sobre Nós
  </h2>

  <p>
    Olá, sou Delano, o criador do Onetime Secret. O que começou em 2012 como uma forma simples e segura de compartilhar informações sensíveis cresceu além das nossas expectativas mais ousadas. Mais de uma década depois, estamos facilitando o compartilhamento seguro de milhões de segredos mensalmente, com casos de uso que nunca imaginamos.
  </p>

  <p>
    O primeiro semestre de 2024 foi nosso período mais movimentado até agora. Somos gratos por as pessoas continuarem a usar e compartilhar nosso produto por mais de uma década. Estamos atualmente trabalhando em melhorias que acreditamos que tornarão o serviço ainda mais útil — compartilharemos mais detalhes em breve.
  </p>

  <p>
    Fiéis às nossas raízes, <a href="https://github.com/onetimesecret/onetimesecret">our code remains open-source</a> no GitHub. Enquanto navegamos pelo cenário em evolução da privacidade e segurança digital, estamos comprometidos com a transparência e a melhoria contínua.
  </p>

  <p>
    Obrigado por fazer parte da nossa jornada. Um brinde a outra década de compartilhamento seguro e efêmero.
  </p>

  <p>
    Se você tiver alguma dúvida, há um formulário de feedback na parte inferior de (quase) todas as páginas.
  </p>

  <p>
    Boas partilhas,
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

  <h4>Por que eu usaria isso?</h4>
  <p>
    Quando você envia senhas e links privados para pessoas por email ou chat, cópias dessas informações são armazenadas em muitos lugares. Se você usar um link Onetime, a informação persiste apenas para uma única visualização, o que significa que não pode ser lida por outra pessoa posteriormente. Isso permite enviar informações sensíveis de forma segura, sabendo que serão vistas apenas por uma pessoa. Pense nisso como uma mensagem autodestrutiva.
  </p>

  <h4>Por que não posso enviar fotos ou outros tipos de arquivos?</h4>
  <p>
    Nosso serviço é projetado especificamente para segredos baseados em texto para garantir máxima segurança e simplicidade. Arquivos, especialmente imagens, podem conter metadados que podem revelar informações não intencionais sobre o remetente ou destinatário. Ao focar em texto, podemos garantir que nenhum dado adicional seja transmitido além do que você digita explicitamente. Se precisar compartilhar um arquivo com segurança, recomendamos usar um serviço dedicado de transferência segura de arquivos. Podemos considerar adicionar suporte para arquivos no futuro, se houver casos de uso convincentes para isso.
  </p>

  <h4>Mas eu posso copiar o texto do segredo. Qual é a diferença?</h4>
  <p>
    Verdade, mas tudo o que você tem é texto. Imagens e outros tipos de arquivos podem conter metadados e outras informações potencialmente reveladoras sobre o remetente ou destinatário. Novamente, isso é simplesmente para garantir que nenhuma informação privada seja compartilhada fora do destinatário pretendido.
  </p>

  <h4>Posso recuperar um segredo que já foi compartilhado?</h4>
  <p>
    Não. Nós o exibimos uma vez e depois o excluímos. Depois disso, ele desaparece para sempre.
  </p>

  <h4>Qual é a diferença entre o uso anônimo e ter uma conta gratuita?</h4>
  <p>
    Usuários anônimos podem criar segredos que duram até 7 dias e têm um tamanho máximo de 100 KB. Titulares de contas gratuitas obtêm benefícios estendidos: os segredos podem durar até 14 dias e ter até 1000 KB de tamanho. Os titulares de contas também têm acesso a recursos adicionais, como opções de remoção antes da leitura, que permitem aos remetentes excluir segredos antes de serem recebidos.
  </p>

  <h4>Como vocês lidam com solicitações de dados de autoridades policiais ou outros terceiros?</h4>
  <p>
    Fiéis às nossas raízes, <a href="https://github.com/onetimesecret/onetimesecret">our code remains open-source</a> no GitHub. Enquanto navegamos pelo cenário em evolução da privacidade e segurança digital, estamos comprometidos com a transparência e a melhoria contínua.
  </p>
  <p>
    Projetamos nosso sistema com a privacidade em mente. Não armazenamos segredos após serem visualizados e não mantemos logs de acesso além do mínimo necessário. Isso significa que, na maioria dos casos, simplesmente não temos dados para fornecer em resposta a tais solicitações. Para mais detalhes, revise nossa <a href="/privacy">privacy policy</a>.
  </p>

  <h4>Por que devo confiar em vocês?</h4>
  <p>
    Projetamos nosso sistema com privacidade e segurança como principais prioridades. Eis por que você pode confiar em nós:
  </p>
  <ul>
    <li>Não podemos acessar suas informações mesmo que quiséssemos (o que não queremos). Por exemplo, se você compartilhar uma senha, não sabemos o nome de usuário ou mesmo para qual aplicativo ela se destina.</li>
    <li>Se você usar uma senha mestre (disponível em "Opções de Privacidade"), nós a incluímos na chave de criptografia do segredo. Armazenamos apenas um hash bcrypt da senha mestre, tornando impossível para nós descriptografar seu segredo depois de salvo.</li>
    <li>Nosso código é <a href="https://github.com/onetimesecret/onetimesecret">open source</a>. Você pode revisá-lo ou até mesmo executar sua própria instância, se preferir.</li>
    <li>Usamos práticas de segurança padrão da indústria, incluindo HTTPS para todas as conexões e criptografia em repouso para dados armazenados.</li>
  </ul>

  <h4>Como funciona a opção de senha mestre?</h4>
  <p>
    Quando você usa uma senha mestre, criptografamos seu segredo em nossos servidores usando a senha mestre que você fornece. Não armazenamos a senha mestre em si, apenas um hash bcrypt dela. Esse hash é usado para verificar a senha mestre quando o destinatário a insere. Eis por que isso é seguro:
  </p>
  <ul>
    <li>Nunca armazenamos o segredo não criptografado ou a senha mestre.</li>
    <li>O hash bcrypt não pode ser usado para descriptografar o segredo.</li>
    <li>Sem a senha mestre original, o segredo criptografado não pode ser descriptografado, nem mesmo por nós.</li>
    <li>Isso significa que, mesmo que nossos servidores fossem comprometidos, seu segredo permaneceria seguro enquanto a senha mestre permanecer desconhecida.</li>
  </ul>
  <p>
    Lembre-se, a segurança do seu segredo depende da força da sua senha mestre e de quão seguramente você a comunica ao destinatário.
  </p>
</article>
