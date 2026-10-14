import type { LegalDoc } from "./types";
import type { Locale } from "@/lib/site";

export const TERMS: Record<Locale, LegalDoc> = {
  en: {
    title: "Terms of Service",
    summary:
      "The rules for using WillFolks: what the app does with the money you stake, what you are responsible for, and what we are not.",
    sections: [
      {
        id: "agreement",
        title: "Agreement",
        body: [
          "These Terms of Service (the \"Terms\") are an agreement between you and WillFolks (\"WillFolks\", \"we\", \"us\"). They apply to the WillFolks mobile application, this website and any related services (together, the \"Service\").",
          "By creating an account or using the Service you accept these Terms. If you do not agree with them, do not use the Service.",
        ],
      },
      {
        id: "service",
        title: "What WillFolks is",
        body: [
          "WillFolks is a commitment tool. You set a goal, stake an amount of money on it, and the outcome of the goal decides what happens to that stake.",
          {
            list: [
              "Measurable goals are checked with data from your device, such as whether you dismissed an alarm in time, how long you used an app, or whether you reached a place on schedule.",
              "Goals that cannot be measured by a sensor are assessed by an AI agent, either on your device or on another participant's device through our peer-to-peer network.",
              "Goals can be private or shared with other people as a group challenge.",
            ],
          },
          "WillFolks is not a bank, a broker, an investment adviser or a gambling operator, and nothing in the Service is financial advice.",
        ],
      },
      {
        id: "eligibility",
        title: "Who can use it",
        body: [
          "You must be at least 18 years old, or the age of legal majority where you live if that is higher, and able to enter into a binding contract.",
          "You are responsible for making sure that using the Service, including staking money and joining group challenges, is lawful where you are. Do not use the Service where it is prohibited.",
        ],
      },
      {
        id: "account",
        title: "Your account and wallet",
        body: [
          "You sign in through a third-party identity provider (OAuth). When you do, an in-app wallet is created and linked to your account.",
          {
            list: [
              "Keep your sign-in method and your device secure. Activity carried out through your account is treated as yours.",
              "Recovery mechanisms exist for the account and the wallet, but they depend on you keeping access to your sign-in method and any recovery material we ask you to store.",
              "We may end inactive sessions automatically to protect your account.",
              "Tell us straight away if you believe someone else has accessed your account.",
            ],
          },
        ],
      },
      {
        id: "stakes",
        title: "Goals, stakes and escrow",
        body: [
          "When you create a goal you choose the amount to stake and the conditions of the goal. Before you confirm, the app shows you the rules that will apply. Read them: once confirmed, they are enforced automatically.",
          "Staked funds are held in escrow by a smart contract on a public blockchain. Escrow and resolution run on-chain; we cannot reverse a confirmed transaction on your behalf.",
          {
            list: [
              "If you meet the goal, your stake is released and you can withdraw it at any time.",
              "If you miss the goal, the stake is handled according to the option you selected when you created it. Depending on that option it may be locked for a set period as a penalty, paid out to the other participants of a group challenge, or sent as a contribution to the developer.",
              "Any yield shown in the app is an estimate. It can change and is never guaranteed.",
            ],
          },
        ],
      },
      {
        id: "verification",
        title: "How goals are verified",
        body: [
          "The result of a goal is determined by the verification method attached to it: device data, an AI assessment, or other participants' devices.",
          "No verification method is perfect. Sensors can be inaccurate, connectivity can fail and automated assessments can be wrong. You accept that the recorded result decides the outcome of the stake.",
          "If you believe a result is wrong, contact us with the details. We will review it and help where we can, but on-chain outcomes may be impossible to change.",
          "Tampering with verification, such as spoofing location, altering device time or submitting fabricated evidence, is a breach of these Terms.",
        ],
      },
      {
        id: "groups",
        title: "Group challenges",
        body: [
          "In a group challenge several people stake on the same goal and the stakes of those who miss it may be distributed to those who meet it.",
          "Only join challenges with people you choose to play with. Payments between participants are made automatically according to the rules of the challenge, and we do not mediate personal disputes between participants.",
        ],
      },
      {
        id: "payments",
        title: "Deposits, withdrawals and fees",
        body: [
          "You can fund goals with supported traditional currencies or cryptocurrencies. Card and bank payments are handled by third-party payment providers under their own terms.",
          {
            list: [
              "Blockchain transactions carry network fees that are set by the network, not by us.",
              "Blockchain transactions are final. Check addresses and amounts before you confirm.",
              "Any fee or optional developer contribution is shown before you confirm a goal.",
              "You are responsible for any taxes that apply to your use of the Service.",
            ],
          },
        ],
      },
      {
        id: "risks",
        title: "Risks you accept",
        body: [
          "Using the Service involves real financial risk. In particular:",
          {
            list: [
              "You can lose access to staked funds, temporarily or permanently, if you miss a goal.",
              "Digital assets can change in value, and stablecoins can lose their peg.",
              "Smart contracts and blockchain networks can contain flaws, be congested or be attacked.",
              "If you lose access to your sign-in method and recovery material, you may lose access to your wallet.",
            ],
          },
          "Only stake amounts you can afford to have locked or lost.",
        ],
      },
      {
        id: "conduct",
        title: "Acceptable use",
        body: [
          "You agree not to:",
          {
            list: [
              "use the Service for anything unlawful, including money laundering or fraud;",
              "cheat, collude or manipulate the result of a goal;",
              "harass other users or pressure anyone into staking money;",
              "interfere with, probe or attempt to bypass the security of the Service;",
              "use automated means to access the Service without our permission.",
            ],
          },
        ],
      },
      {
        id: "ip",
        title: "Our content",
        body: [
          "The WillFolks name, logo, software, design and content belong to WillFolks or its licensors. We grant you a personal, non-transferable, revocable licence to use the app for its intended purpose.",
          "Third-party services that connect to WillFolks, such as music apps used for alarm sounds, remain subject to their own terms.",
        ],
      },
      {
        id: "availability",
        title: "Availability and changes",
        body: [
          "The Service is under active development. Features described on this website may be unavailable, limited to certain regions or devices, or change before release.",
          "We may modify, suspend or discontinue parts of the Service. Where that affects funds held in escrow, we will take reasonable steps to let you recover what is yours under the rules of the relevant goal.",
        ],
      },
      {
        id: "disclaimer",
        title: "Disclaimers",
        body: [
          "The Service is provided \"as is\" and \"as available\". To the extent the law allows, we disclaim all warranties, express or implied, including fitness for a particular purpose and uninterrupted or error-free operation.",
          "WillFolks helps you hold yourself to a commitment. It does not guarantee that you will achieve any goal, and it is not a substitute for professional, medical or financial advice.",
        ],
      },
      {
        id: "liability",
        title: "Limitation of liability",
        body: [
          "To the extent the law allows, WillFolks is not liable for indirect, incidental or consequential losses, for loss of profits or data, or for losses caused by third-party services, blockchain networks, or events outside our reasonable control.",
          "Nothing in these Terms limits liability that cannot be limited by law, and nothing removes rights you have as a consumer under the law that applies to you.",
        ],
      },
      {
        id: "termination",
        title: "Ending your use",
        body: [
          "You can stop using the Service at any time. Goals that are already active continue to follow their rules until they are resolved.",
          "We may suspend or close an account that breaches these Terms or creates risk for other users. Funds that belong to you remain yours, subject to the rules of any active goal and to the law.",
        ],
      },
      {
        id: "changes",
        title: "Changes to these Terms",
        body: [
          "We may update these Terms as the Service evolves. If a change is significant we will tell you in the app or on this website before it takes effect. Continuing to use the Service after that date means you accept the updated Terms.",
        ],
      },
      {
        id: "law",
        title: "Governing law and contact",
        body: [
          "These Terms are governed by the laws of the place where the operator of WillFolks is established, without affecting mandatory consumer protections in your country of residence.",
          "Questions about these Terms can be sent to the contact address below.",
        ],
      },
    ],
  },

  es: {
    title: "Términos de Servicio",
    summary:
      "Las reglas para usar WillFolks: qué hace la app con el dinero que apuestas, de qué eres responsable tú y de qué no lo somos nosotros.",
    sections: [
      {
        id: "agreement",
        title: "Acuerdo",
        body: [
          "Estos Términos de Servicio (los \"Términos\") son un acuerdo entre tú y WillFolks (\"WillFolks\", \"nosotros\"). Se aplican a la aplicación móvil WillFolks, a este sitio web y a los servicios relacionados (en conjunto, el \"Servicio\").",
          "Al crear una cuenta o usar el Servicio aceptas estos Términos. Si no estás de acuerdo, no uses el Servicio.",
        ],
      },
      {
        id: "service",
        title: "Qué es WillFolks",
        body: [
          "WillFolks es una herramienta de compromiso. Defines una meta, apuestas una cantidad de dinero por ella y el resultado de la meta decide qué pasa con esa apuesta.",
          {
            list: [
              "Las metas medibles se comprueban con datos de tu dispositivo: si apagaste una alarma a tiempo, cuánto usaste una app o si llegaste a un lugar a la hora prevista.",
              "Las metas que un sensor no puede medir las evalúa un agente de IA, en tu dispositivo o en el de otro participante a través de nuestra red entre pares.",
              "Las metas pueden ser privadas o compartirse con otras personas como reto grupal.",
            ],
          },
          "WillFolks no es un banco, un bróker, un asesor de inversiones ni un operador de juegos de azar, y nada en el Servicio constituye asesoría financiera.",
        ],
      },
      {
        id: "eligibility",
        title: "Quién puede usarlo",
        body: [
          "Debes tener al menos 18 años, o la mayoría de edad de tu lugar de residencia si es superior, y capacidad para celebrar un contrato vinculante.",
          "Eres responsable de asegurarte de que usar el Servicio, incluyendo apostar dinero y unirte a retos grupales, sea legal donde te encuentras. No uses el Servicio donde esté prohibido.",
        ],
      },
      {
        id: "account",
        title: "Tu cuenta y tu billetera",
        body: [
          "Inicias sesión mediante un proveedor de identidad externo (OAuth). Al hacerlo se crea una billetera dentro de la app vinculada a tu cuenta.",
          {
            list: [
              "Mantén seguros tu método de inicio de sesión y tu dispositivo. La actividad realizada desde tu cuenta se considera tuya.",
              "Existen mecanismos de recuperación para la cuenta y la billetera, pero dependen de que conserves el acceso a tu método de inicio de sesión y al material de recuperación que te pidamos guardar.",
              "Podemos cerrar automáticamente las sesiones inactivas para proteger tu cuenta.",
              "Avísanos de inmediato si crees que otra persona accedió a tu cuenta.",
            ],
          },
        ],
      },
      {
        id: "stakes",
        title: "Metas, apuestas y depósito en garantía",
        body: [
          "Al crear una meta eliges la cantidad a apostar y las condiciones. Antes de confirmar, la app te muestra las reglas que se aplicarán. Léelas: una vez confirmadas, se ejecutan de forma automática.",
          "Los fondos apostados quedan en garantía en un contrato inteligente sobre una blockchain pública. La custodia y la resolución ocurren on-chain; no podemos revertir en tu nombre una transacción confirmada.",
          {
            list: [
              "Si cumples la meta, tu apuesta se libera y puedes retirarla cuando quieras.",
              "Si no la cumples, la apuesta se gestiona según la opción que elegiste al crearla. Según esa opción puede quedar bloqueada durante un periodo como penalización, repartirse entre los demás participantes de un reto grupal o enviarse como aporte al desarrollador.",
              "Cualquier rendimiento que muestre la app es una estimación. Puede cambiar y nunca está garantizado.",
            ],
          },
        ],
      },
      {
        id: "verification",
        title: "Cómo se verifican las metas",
        body: [
          "El resultado de una meta lo determina el método de verificación asociado: datos del dispositivo, una evaluación por IA o los dispositivos de otros participantes.",
          "Ningún método de verificación es perfecto. Los sensores pueden ser imprecisos, la conexión puede fallar y las evaluaciones automáticas pueden equivocarse. Aceptas que el resultado registrado decide el destino de la apuesta.",
          "Si crees que un resultado es incorrecto, escríbenos con los detalles. Lo revisaremos y ayudaremos en lo posible, pero los resultados on-chain pueden ser imposibles de modificar.",
          "Manipular la verificación, por ejemplo falseando la ubicación, alterando la hora del dispositivo o enviando evidencia fabricada, es un incumplimiento de estos Términos.",
        ],
      },
      {
        id: "groups",
        title: "Retos grupales",
        body: [
          "En un reto grupal varias personas apuestan por la misma meta, y las apuestas de quienes fallan pueden repartirse entre quienes la cumplen.",
          "Únete solo a retos con personas con las que quieras jugar. Los pagos entre participantes se realizan automáticamente según las reglas del reto, y no mediamos en disputas personales entre participantes.",
        ],
      },
      {
        id: "payments",
        title: "Depósitos, retiros y comisiones",
        body: [
          "Puedes financiar tus metas con las monedas tradicionales o criptomonedas admitidas. Los pagos con tarjeta o banco los procesan proveedores externos bajo sus propias condiciones.",
          {
            list: [
              "Las transacciones en blockchain tienen comisiones de red que fija la red, no nosotros.",
              "Las transacciones en blockchain son definitivas. Revisa direcciones y montos antes de confirmar.",
              "Cualquier comisión o aporte opcional al desarrollador se muestra antes de confirmar una meta.",
              "Eres responsable de los impuestos que correspondan por tu uso del Servicio.",
            ],
          },
        ],
      },
      {
        id: "risks",
        title: "Riesgos que aceptas",
        body: [
          "Usar el Servicio implica un riesgo financiero real. En particular:",
          {
            list: [
              "Puedes perder el acceso a los fondos apostados, de forma temporal o permanente, si no cumples una meta.",
              "Los activos digitales pueden cambiar de valor y las stablecoins pueden perder su paridad.",
              "Los contratos inteligentes y las redes blockchain pueden tener fallos, congestionarse o ser atacados.",
              "Si pierdes el acceso a tu método de inicio de sesión y a tu material de recuperación, puedes perder el acceso a tu billetera.",
            ],
          },
          "Apuesta solo cantidades que puedas permitirte tener bloqueadas o perder.",
        ],
      },
      {
        id: "conduct",
        title: "Uso aceptable",
        body: [
          "Te comprometes a no:",
          {
            list: [
              "usar el Servicio para fines ilícitos, incluidos el lavado de dinero o el fraude;",
              "hacer trampa, coludirte o manipular el resultado de una meta;",
              "acosar a otros usuarios ni presionar a nadie para que apueste dinero;",
              "interferir, sondear o intentar eludir la seguridad del Servicio;",
              "acceder al Servicio por medios automatizados sin nuestro permiso.",
            ],
          },
        ],
      },
      {
        id: "ip",
        title: "Nuestro contenido",
        body: [
          "El nombre, el logotipo, el software, el diseño y el contenido de WillFolks pertenecen a WillFolks o a sus licenciantes. Te concedemos una licencia personal, intransferible y revocable para usar la app con su finalidad prevista.",
          "Los servicios de terceros que se conectan a WillFolks, como las apps de música usadas para el sonido de las alarmas, siguen sujetos a sus propias condiciones.",
        ],
      },
      {
        id: "availability",
        title: "Disponibilidad y cambios",
        body: [
          "El Servicio está en desarrollo activo. Las funciones descritas en este sitio pueden no estar disponibles, limitarse a ciertas regiones o dispositivos, o cambiar antes del lanzamiento.",
          "Podemos modificar, suspender o discontinuar partes del Servicio. Cuando eso afecte a fondos en garantía, tomaremos medidas razonables para que puedas recuperar lo que te corresponde según las reglas de la meta.",
        ],
      },
      {
        id: "disclaimer",
        title: "Exenciones",
        body: [
          "El Servicio se ofrece \"tal cual\" y \"según disponibilidad\". En la medida en que la ley lo permita, renunciamos a toda garantía, expresa o implícita, incluida la de idoneidad para un fin determinado y la de funcionamiento ininterrumpido o libre de errores.",
          "WillFolks te ayuda a mantener un compromiso contigo mismo. No garantiza que alcances ninguna meta ni sustituye el consejo profesional, médico o financiero.",
        ],
      },
      {
        id: "liability",
        title: "Limitación de responsabilidad",
        body: [
          "En la medida en que la ley lo permita, WillFolks no responde por pérdidas indirectas, incidentales o consecuentes, por lucro cesante o pérdida de datos, ni por pérdidas causadas por servicios de terceros, redes blockchain o hechos fuera de nuestro control razonable.",
          "Nada en estos Términos limita la responsabilidad que la ley no permite limitar, ni elimina los derechos que te correspondan como consumidor según la ley aplicable.",
        ],
      },
      {
        id: "termination",
        title: "Fin del uso",
        body: [
          "Puedes dejar de usar el Servicio en cualquier momento. Las metas ya activas siguen sus reglas hasta resolverse.",
          "Podemos suspender o cerrar una cuenta que incumpla estos Términos o ponga en riesgo a otros usuarios. Los fondos que te pertenecen siguen siendo tuyos, con sujeción a las reglas de las metas activas y a la ley.",
        ],
      },
      {
        id: "changes",
        title: "Cambios en estos Términos",
        body: [
          "Podemos actualizar estos Términos a medida que el Servicio evoluciona. Si un cambio es relevante te avisaremos en la app o en este sitio antes de que entre en vigor. Seguir usando el Servicio después de esa fecha implica aceptar los Términos actualizados.",
        ],
      },
      {
        id: "law",
        title: "Ley aplicable y contacto",
        body: [
          "Estos Términos se rigen por las leyes del lugar donde está establecido el operador de WillFolks, sin afectar las protecciones al consumidor de carácter imperativo de tu país de residencia.",
          "Las preguntas sobre estos Términos pueden enviarse a la dirección de contacto indicada abajo.",
        ],
      },
    ],
  },
};
