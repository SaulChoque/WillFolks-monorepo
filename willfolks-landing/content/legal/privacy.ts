import type { LegalDoc } from "./types";
import type { Locale } from "@/lib/site";

export const PRIVACY: Record<Locale, LegalDoc> = {
  en: {
    title: "Privacy Policy",
    summary:
      "What WillFolks collects, why it needs it, and the choices you have. Short version: we collect as little as the app needs to check your goals and move your stake.",
    sections: [
      {
        id: "overview",
        title: "Overview",
        body: [
          "This policy explains how WillFolks (\"WillFolks\", \"we\", \"us\") handles personal data when you use the WillFolks mobile application and this website (together, the \"Service\").",
          "WillFolks is designed around data minimisation: sign-up asks for as little as possible, and the device data used to verify a goal is limited to what that goal requires.",
        ],
      },
      {
        id: "collect",
        title: "Data we collect",
        body: [
          "Depending on how you use the Service, we process the following:",
          {
            list: [
              "Account data: the identifier and basic profile details shared by the sign-in provider you choose, and the username and profile information you add.",
              "Wallet data: the public address of your in-app wallet and the transactions made with it.",
              "Goal data: the goals you create, their rules, the amounts staked and their results.",
              "Verification data: only for goals that need it — alarm responses, usage time of the apps you choose to limit, and your location for location-based goals.",
              "Evidence: photos, videos or text you submit so that an unmeasurable goal can be assessed.",
              "Social data: your friends list and the participants of the challenges you join.",
              "Technical data: device model, operating system, app version, language and diagnostic logs.",
              "Support data: messages you send us.",
            ],
          },
        ],
      },
      {
        id: "use",
        title: "How we use it",
        body: [
          {
            list: [
              "To run the Service: create your account and wallet, hold and release stakes, and resolve goals.",
              "To verify goals with the method attached to each one.",
              "To generate your personal activity reports and notify you about events in the app.",
              "To keep the Service secure, prevent cheating and fraud, and fix errors.",
              "To meet legal obligations.",
            ],
          },
          "We do not sell your personal data, and we do not use it to show you third-party advertising.",
        ],
      },
      {
        id: "verification",
        title: "AI and peer verification",
        body: [
          "Goals that cannot be measured by a sensor are assessed automatically from the evidence you provide. The assessment can run on your own device or, through our peer-to-peer network, on the device of another participant that is paid to perform it.",
          "When another device performs the assessment, the evidence needed for that single check is shared with it. Do not include people or information in your evidence that you are not willing to share for that purpose.",
          "Automated results decide the outcome of a stake. If you think one is wrong, you can ask us for a human review using the contact address below.",
        ],
      },
      {
        id: "blockchain",
        title: "Blockchain data is public",
        body: [
          "Escrow and resolution run on a public blockchain. Wallet addresses, amounts and transaction times recorded there are visible to anyone and cannot be edited or deleted by us or by you.",
          "We do not publish your name or contact details on-chain. However, someone who can link your wallet address to you may be able to see the transactions made with it.",
        ],
      },
      {
        id: "sharing",
        title: "Who we share it with",
        body: [
          {
            list: [
              "Service providers that help us operate: sign-in, payment processing, hosting and diagnostics. They may only use the data to provide their service to us.",
              "Other users: participants of a challenge you join can see your username and your result in that challenge.",
              "Verifying devices, as described above.",
              "Authorities, when the law requires it or to protect the rights and safety of our users.",
              "A successor, if WillFolks is reorganised or transferred, under commitments equivalent to this policy.",
            ],
          },
        ],
      },
      {
        id: "retention",
        title: "How long we keep it",
        body: [
          "We keep account and goal data while your account is open. Verification data and evidence are kept only as long as needed to resolve the goal and handle a possible dispute, then deleted or anonymised.",
          "Some records must be kept longer to comply with legal, tax or anti-fraud obligations. On-chain records are permanent by nature.",
        ],
      },
      {
        id: "security",
        title: "Security",
        body: [
          "We protect data in transit and at rest, limit access to those who need it, and ask you to authenticate before sensitive wallet details are shown. Inactive sessions are closed automatically.",
          "No system is perfectly secure. If a breach affects your data, we will notify you as the law requires.",
        ],
      },
      {
        id: "rights",
        title: "Your choices and rights",
        body: [
          {
            list: [
              "Permissions: location, usage access and notifications are controlled from your device settings. Turning one off disables the goals that depend on it.",
              "Access and portability: you can ask for a copy of your data.",
              "Correction and deletion: you can correct your profile and ask us to delete your account. Active goals must be resolved first, and on-chain records cannot be erased.",
              "Objection and restriction: you can object to certain processing or ask us to limit it.",
              "Complaints: you can complain to the data protection authority where you live.",
            ],
          },
          "To exercise any of these rights, write to the contact address below. We may need to confirm your identity first.",
        ],
      },
      {
        id: "children",
        title: "Children",
        body: [
          "The Service is for adults. We do not knowingly collect data from anyone under 18. If you believe a minor has created an account, tell us and we will remove it.",
        ],
      },
      {
        id: "transfers",
        title: "International transfers",
        body: [
          "Our providers may process data in countries other than yours. When that happens we rely on the safeguards the applicable law requires for such transfers.",
        ],
      },
      {
        id: "cookies",
        title: "Cookies on this website",
        body: [
          "This website stores a single functional cookie, NEXT_LOCALE, to remember the language you picked. It holds no personal information and is not used to track you.",
          "This website does not use advertising or analytics cookies.",
        ],
      },
      {
        id: "changes",
        title: "Changes to this policy",
        body: [
          "We will update this policy when our practices change. The date at the top shows the latest revision, and significant changes will be announced in the app or on this website before they apply.",
        ],
      },
      {
        id: "contact",
        title: "Contact",
        body: [
          "For questions about this policy or to exercise your rights, use the contact address below.",
        ],
      },
    ],
  },

  es: {
    title: "Política de Privacidad",
    summary:
      "Qué recopila WillFolks, para qué lo necesita y qué opciones tienes. En corto: recopilamos lo mínimo que la app necesita para comprobar tus metas y mover tu apuesta.",
    sections: [
      {
        id: "overview",
        title: "Resumen",
        body: [
          "Esta política explica cómo WillFolks (\"WillFolks\", \"nosotros\") trata los datos personales cuando usas la aplicación móvil WillFolks y este sitio web (en conjunto, el \"Servicio\").",
          "WillFolks está diseñado bajo el principio de minimización de datos: el registro pide lo mínimo posible y los datos del dispositivo usados para verificar una meta se limitan a lo que esa meta requiere.",
        ],
      },
      {
        id: "collect",
        title: "Datos que recopilamos",
        body: [
          "Según cómo uses el Servicio, tratamos lo siguiente:",
          {
            list: [
              "Datos de cuenta: el identificador y los datos básicos de perfil que comparte el proveedor de inicio de sesión que elijas, y el nombre de usuario y la información de perfil que agregues.",
              "Datos de billetera: la dirección pública de tu billetera en la app y las transacciones realizadas con ella.",
              "Datos de metas: las metas que creas, sus reglas, los montos apostados y sus resultados.",
              "Datos de verificación: solo para las metas que lo necesitan — respuestas a alarmas, tiempo de uso de las apps que decides limitar y tu ubicación para las metas basadas en ubicación.",
              "Evidencia: fotos, videos o texto que envías para que se evalúe una meta no medible.",
              "Datos sociales: tu lista de amigos y los participantes de los retos a los que te unes.",
              "Datos técnicos: modelo del dispositivo, sistema operativo, versión de la app, idioma y registros de diagnóstico.",
              "Datos de soporte: los mensajes que nos envías.",
            ],
          },
        ],
      },
      {
        id: "use",
        title: "Para qué los usamos",
        body: [
          {
            list: [
              "Para operar el Servicio: crear tu cuenta y tu billetera, custodiar y liberar apuestas, y resolver metas.",
              "Para verificar las metas con el método asociado a cada una.",
              "Para generar tus reportes de actividad y notificarte los eventos de la app.",
              "Para mantener seguro el Servicio, prevenir trampas y fraude, y corregir errores.",
              "Para cumplir obligaciones legales.",
            ],
          },
          "No vendemos tus datos personales ni los usamos para mostrarte publicidad de terceros.",
        ],
      },
      {
        id: "verification",
        title: "Verificación por IA y entre pares",
        body: [
          "Las metas que un sensor no puede medir se evalúan automáticamente a partir de la evidencia que aportas. La evaluación puede ejecutarse en tu propio dispositivo o, a través de nuestra red entre pares, en el dispositivo de otro participante que recibe un pago por realizarla.",
          "Cuando la evaluación la hace otro dispositivo, se comparte con él la evidencia necesaria para esa única comprobación. No incluyas en tu evidencia personas ni información que no estés dispuesto a compartir con ese fin.",
          "Los resultados automáticos deciden el destino de una apuesta. Si crees que uno es incorrecto, puedes pedirnos una revisión humana escribiendo a la dirección de contacto indicada abajo.",
        ],
      },
      {
        id: "blockchain",
        title: "Los datos en blockchain son públicos",
        body: [
          "La custodia y la resolución ocurren en una blockchain pública. Las direcciones de billetera, los montos y las fechas de las transacciones registradas allí son visibles para cualquiera y ni tú ni nosotros podemos editarlas o borrarlas.",
          "No publicamos tu nombre ni tus datos de contacto on-chain. Sin embargo, alguien capaz de vincular tu dirección de billetera contigo podría ver las transacciones hechas con ella.",
        ],
      },
      {
        id: "sharing",
        title: "Con quién los compartimos",
        body: [
          {
            list: [
              "Proveedores que nos ayudan a operar: inicio de sesión, procesamiento de pagos, alojamiento y diagnóstico. Solo pueden usar los datos para prestarnos su servicio.",
              "Otros usuarios: los participantes de un reto al que te unes pueden ver tu nombre de usuario y tu resultado en ese reto.",
              "Dispositivos verificadores, como se describe arriba.",
              "Autoridades, cuando la ley lo exige o para proteger los derechos y la seguridad de nuestros usuarios.",
              "Un sucesor, si WillFolks se reorganiza o se transfiere, bajo compromisos equivalentes a esta política.",
            ],
          },
        ],
      },
      {
        id: "retention",
        title: "Cuánto tiempo los conservamos",
        body: [
          "Conservamos los datos de cuenta y de metas mientras tu cuenta esté abierta. Los datos de verificación y la evidencia se conservan solo el tiempo necesario para resolver la meta y atender una posible disputa; después se eliminan o anonimizan.",
          "Algunos registros deben conservarse más tiempo para cumplir obligaciones legales, fiscales o antifraude. Los registros on-chain son permanentes por naturaleza.",
        ],
      },
      {
        id: "security",
        title: "Seguridad",
        body: [
          "Protegemos los datos en tránsito y en reposo, limitamos el acceso a quienes lo necesitan y te pedimos autenticarte antes de mostrar datos sensibles de la billetera. Las sesiones inactivas se cierran automáticamente.",
          "Ningún sistema es totalmente seguro. Si una brecha afecta tus datos, te lo notificaremos como exige la ley.",
        ],
      },
      {
        id: "rights",
        title: "Tus opciones y derechos",
        body: [
          {
            list: [
              "Permisos: la ubicación, el acceso de uso y las notificaciones se controlan desde los ajustes de tu dispositivo. Desactivar uno deshabilita las metas que dependen de él.",
              "Acceso y portabilidad: puedes pedir una copia de tus datos.",
              "Rectificación y supresión: puedes corregir tu perfil y pedirnos que eliminemos tu cuenta. Antes deben resolverse las metas activas, y los registros on-chain no pueden borrarse.",
              "Oposición y limitación: puedes oponerte a ciertos tratamientos o pedirnos que los limitemos.",
              "Reclamos: puedes presentar un reclamo ante la autoridad de protección de datos de tu lugar de residencia.",
            ],
          },
          "Para ejercer cualquiera de estos derechos, escribe a la dirección de contacto indicada abajo. Es posible que antes necesitemos confirmar tu identidad.",
        ],
      },
      {
        id: "children",
        title: "Menores de edad",
        body: [
          "El Servicio es para personas adultas. No recopilamos a sabiendas datos de menores de 18 años. Si crees que un menor creó una cuenta, avísanos y la eliminaremos.",
        ],
      },
      {
        id: "transfers",
        title: "Transferencias internacionales",
        body: [
          "Nuestros proveedores pueden tratar datos en países distintos al tuyo. Cuando eso ocurre, nos apoyamos en las garantías que la ley aplicable exige para esas transferencias.",
        ],
      },
      {
        id: "cookies",
        title: "Cookies en este sitio web",
        body: [
          "Este sitio guarda una única cookie funcional, NEXT_LOCALE, para recordar el idioma que elegiste. No contiene información personal ni se usa para rastrearte.",
          "Este sitio no usa cookies de publicidad ni de analítica.",
        ],
      },
      {
        id: "changes",
        title: "Cambios en esta política",
        body: [
          "Actualizaremos esta política cuando cambien nuestras prácticas. La fecha de arriba indica la última revisión, y los cambios relevantes se anunciarán en la app o en este sitio antes de aplicarse.",
        ],
      },
      {
        id: "contact",
        title: "Contacto",
        body: [
          "Para consultas sobre esta política o para ejercer tus derechos, usa la dirección de contacto indicada abajo.",
        ],
      },
    ],
  },
};
