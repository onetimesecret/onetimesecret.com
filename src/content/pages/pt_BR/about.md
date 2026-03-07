---
title: Sobre Nós

---

Oi, sou Delano, o criador do Onetime Secret. O que começou em 2011 como uma forma simples e segura de compartilhar informações sensíveis evoluiu muito além da visão inicial. Mais de uma década depois, estamos totalmente no negócio de serviços de "segredos", atendendo casos de uso que eu nunca imaginei.

## O que construímos

Ao longo dos anos, passamos de uma ferramenta simples para um serviço focado em compartilhar informações sensíveis:
- [Domínios personalizados e identidade visual](https://docs.onetimesecret.com/en/custom-domains/) para equipes e empresas
- Múltiplas regiões, incluindo [EUA](https://us.onetimesecret.com), [Canadá](https://ca.onetimesecret.com) e [Aotearoa Nova Zelândia](https://nz.onetimesecret.com)
- Planos de assinatura que transformaram um hobby de longa data em um negócio sustentável
- Lançamentos regulares no [GitHub](https://github.com/onetimesecret/onetimesecret/releases)

## Nossa abordagem

Seguimos firmes nos [princípios fundamentais](https://docs.onetimesecret.com/en/principles/) que nos motivaram desde o início. [Nosso código é open-source](https://github.com/onetimesecret/onetimesecret) porque acreditamos em transparência, contribuição da comunidade e em compartilhar coisas boas.

À medida que a privacidade digital e os desafios da internet evoluem, nós também evoluímos — ajustando a segurança, tornando as coisas mais fáceis de usar e garantindo que nosso serviço funcione bem para todos que precisam dele.

> Você sabia? Em 2011, Drew Carey sugeriu que "One Time Secret" daria um [bom nome de banda](https://x.com/DrewFromTV/status/142730130689761280). O que a indústria musical perdeu, a internet ganhou.

## Caixa de sugestões

Tem perguntas ou ideias? Há um [formulário de feedback](/feedback) na parte inferior de (quase) todas as páginas.

Boas partilhas,
Delano

<img src="/etc/img/delano-g.png" alt="Delano" width="95" height="120" />

---



## F.A.Q.

### Por que eu usaria isso?

Quando você envia senhas e links privados para pessoas por email ou chat, cópias dessas informações são armazenadas em muitos lugares. Se você usar um link Onetime, a informação persiste apenas para uma única visualização, o que significa que não pode ser lida por outra pessoa posteriormente. Isso permite enviar informações sensíveis de forma segura, sabendo que serão vistas apenas por uma pessoa. Pense nisso como uma mensagem autodestrutiva.

### Por que não posso enviar fotos ou outros tipos de arquivos?

Nosso serviço é projetado especificamente para segredos baseados em texto para garantir máxima segurança e simplicidade. Arquivos, especialmente imagens, podem conter metadados que podem revelar informações não intencionais sobre o remetente ou destinatário. Ao focar em texto, podemos garantir que nenhum dado adicional seja transmitido além do que você digita explicitamente. Se precisar compartilhar um arquivo com segurança, recomendamos usar um serviço dedicado de transferência segura de arquivos. Podemos considerar adicionar suporte para arquivos no futuro, se houver casos de uso convincentes para isso.

### Mas eu posso copiar o texto do segredo. Qual é a diferença?

Verdade, mas tudo o que você tem é texto. Imagens e outros tipos de arquivos podem conter metadados e outras informações potencialmente reveladoras sobre o remetente ou destinatário. Novamente, isso é simplesmente para garantir que nenhuma informação privada seja compartilhada fora do destinatário pretendido.

### Posso recuperar um segredo que já foi compartilhado?

Não. Nós o exibimos uma vez e depois o excluímos. Depois disso, ele desaparece para sempre.

### Qual é a diferença entre o uso anônimo e ter uma conta gratuita?

Usuários anônimos podem criar segredos que duram até 7 dias e têm um tamanho máximo de 100 KB. Titulares de contas gratuitas obtêm benefícios estendidos: os segredos podem durar até 14 dias e ter até 1000 KB de tamanho. Os titulares de contas também têm acesso a recursos adicionais, como opções de remoção antes da leitura, que permitem aos remetentes excluir segredos antes de serem recebidos.

### Como vocês lidam com solicitações de dados de autoridades policiais ou outros terceiros?

Fiéis às nossas raízes, [nosso código continua sendo open-source](https://github.com/onetimesecret/onetimesecret) no GitHub. Enquanto navegamos pelo cenário em evolução da privacidade e segurança digital, estamos comprometidos com a transparência e a melhoria contínua.

Projetamos nosso sistema com a privacidade em mente. Não armazenamos segredos após serem visualizados e não mantemos logs de acesso além do mínimo necessário. Isso significa que, na maioria dos casos, simplesmente não temos dados para fornecer em resposta a tais solicitações. Para mais detalhes, revise nossa [política de privacidade](/privacy).

### Por que devo confiar em vocês?

Projetamos nosso sistema com privacidade e segurança como principais prioridades. Eis por que você pode confiar em nós:

- Não podemos acessar suas informações mesmo que quiséssemos (o que não queremos). Por exemplo, se você compartilhar uma senha, não sabemos o nome de usuário ou mesmo para qual aplicativo ela se destina.
- Se você usar uma frase secreta (disponível em "Opções de Privacidade"), nós a incluímos na chave de criptografia do segredo. Armazenamos apenas um hash bcrypt da frase secreta, tornando impossível para nós descriptografar seu segredo depois de salvo.
- Nosso código é [open source](https://github.com/onetimesecret/onetimesecret). Você pode revisá-lo ou até mesmo executar sua própria instância, se preferir.
- Usamos práticas de segurança padrão da indústria, incluindo HTTPS para todas as conexões e criptografia em repouso para dados armazenados.

### Como funciona a opção de frase secreta?

Quando você usa uma frase secreta, criptografamos seu segredo em nossos servidores usando a frase secreta que você fornece. Não armazenamos a frase secreta em si, apenas um hash bcrypt dela. Esse hash é usado para verificar a frase secreta quando o destinatário a insere. Eis por que isso é seguro:

- Nunca armazenamos o segredo não criptografado ou a frase secreta.
- O hash bcrypt não pode ser usado para descriptografar o segredo.
- Sem a frase secreta original, o segredo criptografado não pode ser descriptografado, nem mesmo por nós.
- Isso significa que, mesmo que nossos servidores fossem comprometidos, seu segredo permaneceria seguro enquanto a frase secreta permanecer desconhecida.

> **Lembre-se**: A segurança do seu segredo depende da força da sua frase secreta e de quão seguramente você a comunica ao destinatário.
