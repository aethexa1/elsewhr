// elsewhr — languages: the door opens in your own words
// Replaces lib/i18n.ts

"use client";

import { createContext, useContext } from "react";

export type Lang = "en" | "es" | "pt" | "hi" | "pl" | "fr";

export const LANGS: { code: Lang; label: string; flag: string; ai: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧", ai: "English" },
  { code: "es", label: "Español", flag: "🇪🇸", ai: "Spanish (español)" },
  { code: "pt", label: "Português", flag: "🇧🇷", ai: "Portuguese (português brasileiro)" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳", ai: "Hindi (हिन्दी)" },
  { code: "pl", label: "Polski", flag: "🇵🇱", ai: "Polish (polski)" },
  { code: "fr", label: "Français", flag: "🇫🇷", ai: "French (français)" },
];

export const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
}>({ lang: "en", setLang: () => {} });

export function useLang() {
  return useContext(LangContext);
}

type Dict = Record<string, string>;

const en: Dict = {
  "hero.eyebrow": "hey, you found us 👋",
  "hero.title1": "Where what you",
  "hero.have": "have",
  "hero.title2": "finds who",
  "hero.needs": "needs",
  "hero.title3": "it.",
  "hero.body":
    "Welders, coders, bakers, students — everyone with real skills and no network to show them to. Your work, shown not claimed. The bird even drafts your profile for you.",
  "hero.cta": "Make my profile →",
  "hero.free": "free · under 5 min · you own everything",
  "hero.already": "already on elsewhr?",
  "hero.login": "log in →",
  "home.peek": "peek at who's already here ↓",
  "home.alreadyHere": "people already on elsewhr ↓",
  "home.tagline": "real people, shown by what they can actually do.",
  "home.yourPeople": " · your kind of people first ✦",
  "home.youBoth": "✦ you both:",
  "home.tapAnyone": "tap anyone to see their work · real people · live",
  "home.noProfiles": "No profiles yet.",
  "home.beFirst": "Be the first —",
  "home.join": "join elsewhr",
  "sample.badge": "sample profile",
  "sample.long": "sample profile — here to show you the shape",

  "nav.join": "Join elsewhr →",
  "nav.me": "me",
  "nav.myProfile": "👤 My profile",
  "nav.edit": "✏️ Edit my profile",
  "nav.settings": "⚙️ Settings",
  "nav.signout": "👋 Sign out",
  "nav.everyone": "← everyone",

  "profile.lookingFor": "looking for ·",
  "profile.somewhere": "somewhere",
  "profile.showsReal": "shows real work, not a résumé",
  "profile.theWork": "The work",
  "profile.learning": "now learning ·",
  "profile.goal": "future goal ·",
  "profile.living": "this is a living profile on elsewhr ·",
  "profile.makeYours": "make yours",
  "profile.notFound": "Profile not found.",
  "profile.back": "← back to elsewhr",

  "vouch.title": "Vouched by",
  "vouch.button": "🐦 Vouch for {name}",
  "vouch.explain":
    "One honest sentence about their work or how they show up. Your name and face go on this — vouch only for what you've actually seen.",
  "vouch.placeholder": "\"{name} actually ships — I've watched them build.\"",
  "vouch.submit": "Put my name on it",
  "vouch.submitting": "Vouching…",
  "vouch.cancel": "Cancel",
  "vouch.none":
    "no vouches yet — vouches here come from real elsewhr profiles, name and face attached.",
  "vouch.staked": " · real profile, staked on this",
  "vouch.member": "an elsewhr member",
  "vouch.remove": "remove",
  "vouch.confirmRemove": "Remove your vouch?",
  "vouch.short": "Say a little more — one honest sentence.",
  "vouch.signIn": "Log in to vouch for someone.",

  "reach.button": "✉️ Reach out to",
  "reach.explain":
    "The bird delivers this to {name} by email, with your profile attached. Neither of you sees the other's address — replies just work.",
  "reach.sparks": "🐦 the bird noticed — tap to start:",
  "reach.placeholder": "Hey {name} — saw your work on elsewhr and…",
  "reach.send": "Send it 🐦",
  "reach.sending": "Sending…",
  "reach.cancel": "Cancel",
  "reach.sent":
    "🐦 Sent. {name} got your message by email — replies come straight back to your inbox.",
  "reach.short": "Say a little more — a real sentence or two.",
  "reach.failed": "Something went wrong — try again.",
};

const es: Dict = {
  "hero.eyebrow": "hola, nos encontraste 👋",
  "hero.title1": "Donde lo que",
  "hero.have": "tienes",
  "hero.title2": "encuentra a quien lo",
  "hero.needs": "necesita",
  "hero.title3": ".",
  "hero.body":
    "Soldadores, programadores, panaderos, estudiantes — todos con habilidades reales y sin red para mostrarlas. Tu trabajo, mostrado y no solo dicho. El pájaro incluso redacta tu perfil por ti.",
  "hero.cta": "Crear mi perfil →",
  "hero.free": "gratis · menos de 5 min · todo es tuyo",
  "hero.already": "¿ya estás en elsewhr?",
  "hero.login": "iniciar sesión →",
  "home.peek": "mira quién ya está aquí ↓",
  "home.alreadyHere": "personas que ya están en elsewhr ↓",
  "home.tagline": "personas reales, mostradas por lo que saben hacer.",
  "home.yourPeople": " · tu gente primero ✦",
  "home.youBoth": "✦ ambos:",
  "home.tapAnyone": "toca a alguien para ver su trabajo · personas reales · en vivo",
  "home.noProfiles": "Aún no hay perfiles.",
  "home.beFirst": "Sé el primero —",
  "home.join": "únete a elsewhr",
  "sample.badge": "perfil de ejemplo",
  "sample.long": "perfil de ejemplo — para mostrarte la forma",

  "nav.join": "Únete a elsewhr →",
  "nav.me": "yo",
  "nav.myProfile": "👤 Mi perfil",
  "nav.edit": "✏️ Editar mi perfil",
  "nav.settings": "⚙️ Ajustes",
  "nav.signout": "👋 Cerrar sesión",
  "nav.everyone": "← todos",

  "profile.lookingFor": "busca ·",
  "profile.somewhere": "en algún lugar",
  "profile.showsReal": "muestra trabajo real, no un currículum",
  "profile.theWork": "El trabajo",
  "profile.learning": "aprendiendo ahora ·",
  "profile.goal": "meta futura ·",
  "profile.living": "este es un perfil vivo en elsewhr ·",
  "profile.makeYours": "crea el tuyo",
  "profile.notFound": "Perfil no encontrado.",
  "profile.back": "← volver a elsewhr",

  "vouch.title": "Respaldado por",
  "vouch.button": "🐦 Respaldar a {name}",
  "vouch.explain":
    "Una frase honesta sobre su trabajo o cómo se presenta. Tu nombre y tu cara van aquí — respalda solo lo que realmente has visto.",
  "vouch.placeholder": "\"{name} de verdad cumple — lo he visto trabajar.\"",
  "vouch.submit": "Pongo mi nombre",
  "vouch.submitting": "Respaldando…",
  "vouch.cancel": "Cancelar",
  "vouch.none":
    "aún no hay respaldos — los respaldos aquí vienen de perfiles reales de elsewhr, con nombre y cara.",
  "vouch.staked": " · perfil real, se juega su nombre",
  "vouch.member": "un miembro de elsewhr",
  "vouch.remove": "quitar",
  "vouch.confirmRemove": "¿Quitar tu respaldo?",
  "vouch.short": "Escribe un poco más — una frase honesta.",
  "vouch.signIn": "Inicia sesión para respaldar a alguien.",

  "reach.button": "✉️ Escríbele a",
  "reach.explain":
    "El pájaro le entrega esto a {name} por correo, con tu perfil adjunto. Ninguno ve la dirección del otro — las respuestas simplemente funcionan.",
  "reach.sparks": "🐦 el pájaro notó algo — toca para empezar:",
  "reach.placeholder": "Hola {name} — vi tu trabajo en elsewhr y…",
  "reach.send": "Enviar 🐦",
  "reach.sending": "Enviando…",
  "reach.cancel": "Cancelar",
  "reach.sent":
    "🐦 Enviado. {name} recibió tu mensaje por correo — las respuestas llegan directo a tu bandeja.",
  "reach.short": "Escribe un poco más — una o dos frases reales.",
  "reach.failed": "Algo salió mal — inténtalo de nuevo.",
};

const pt: Dict = {
  "hero.eyebrow": "oi, você nos encontrou 👋",
  "hero.title1": "Onde o que você",
  "hero.have": "tem",
  "hero.title2": "encontra quem",
  "hero.needs": "precisa",
  "hero.title3": ".",
  "hero.body":
    "Soldadores, programadores, padeiros, estudantes — todos com habilidades reais e sem rede para mostrá-las. Seu trabalho, mostrado e não apenas dito. O pássaro até escreve seu perfil pra você.",
  "hero.cta": "Criar meu perfil →",
  "hero.free": "grátis · menos de 5 min · tudo é seu",
  "hero.already": "já está no elsewhr?",
  "hero.login": "entrar →",
  "home.peek": "veja quem já está aqui ↓",
  "home.alreadyHere": "pessoas que já estão no elsewhr ↓",
  "home.tagline": "pessoas reais, mostradas pelo que sabem fazer.",
  "home.yourPeople": " · sua gente primeiro ✦",
  "home.youBoth": "✦ vocês dois:",
  "home.tapAnyone": "toque em alguém para ver o trabalho · pessoas reais · ao vivo",
  "home.noProfiles": "Ainda não há perfis.",
  "home.beFirst": "Seja o primeiro —",
  "home.join": "entre no elsewhr",
  "sample.badge": "perfil de exemplo",
  "sample.long": "perfil de exemplo — para mostrar o formato",

  "nav.join": "Entrar no elsewhr →",
  "nav.me": "eu",
  "nav.myProfile": "👤 Meu perfil",
  "nav.edit": "✏️ Editar meu perfil",
  "nav.settings": "⚙️ Configurações",
  "nav.signout": "👋 Sair",
  "nav.everyone": "← todos",

  "profile.lookingFor": "procura ·",
  "profile.somewhere": "em algum lugar",
  "profile.showsReal": "mostra trabalho real, não um currículo",
  "profile.theWork": "O trabalho",
  "profile.learning": "aprendendo agora ·",
  "profile.goal": "meta futura ·",
  "profile.living": "este é um perfil vivo no elsewhr ·",
  "profile.makeYours": "crie o seu",
  "profile.notFound": "Perfil não encontrado.",
  "profile.back": "← voltar ao elsewhr",

  "vouch.title": "Recomendado por",
  "vouch.button": "🐦 Recomendar {name}",
  "vouch.explain":
    "Uma frase honesta sobre o trabalho dessa pessoa. Seu nome e seu rosto vão junto — recomende só o que você realmente viu.",
  "vouch.placeholder": "\"{name} entrega de verdade — já vi trabalhando.\"",
  "vouch.submit": "Assino embaixo",
  "vouch.submitting": "Recomendando…",
  "vouch.cancel": "Cancelar",
  "vouch.none":
    "ainda não há recomendações — elas vêm de perfis reais do elsewhr, com nome e rosto.",
  "vouch.staked": " · perfil real, colocou o nome em jogo",
  "vouch.member": "um membro do elsewhr",
  "vouch.remove": "remover",
  "vouch.confirmRemove": "Remover sua recomendação?",
  "vouch.short": "Escreva um pouco mais — uma frase honesta.",
  "vouch.signIn": "Entre para recomendar alguém.",

  "reach.button": "✉️ Fale com",
  "reach.explain":
    "O pássaro entrega isto a {name} por e-mail, com seu perfil anexado. Nenhum de vocês vê o endereço do outro — as respostas simplesmente funcionam.",
  "reach.sparks": "🐦 o pássaro notou — toque para começar:",
  "reach.placeholder": "Oi {name} — vi seu trabalho no elsewhr e…",
  "reach.send": "Enviar 🐦",
  "reach.sending": "Enviando…",
  "reach.cancel": "Cancelar",
  "reach.sent":
    "🐦 Enviado. {name} recebeu sua mensagem por e-mail — as respostas voltam direto pra sua caixa.",
  "reach.short": "Escreva um pouco mais — uma ou duas frases reais.",
  "reach.failed": "Algo deu errado — tente de novo.",
};

const hi: Dict = {
  "hero.eyebrow": "नमस्ते, आपने हमें ढूंढ लिया 👋",
  "hero.title1": "जहाँ आपके पास जो",
  "hero.have": "है",
  "hero.title2": "उसे मिले जिसे उसकी",
  "hero.needs": "ज़रूरत",
  "hero.title3": "है।",
  "hero.body":
    "वेल्डर, कोडर, बेकर, छात्र — असली हुनर वाले सब लोग, जिनके पास दिखाने का नेटवर्क नहीं है। आपका काम, दिखाया जाए — सिर्फ़ कहा नहीं। चिड़िया आपका प्रोफ़ाइल भी लिख देती है।",
  "hero.cta": "मेरी प्रोफ़ाइल बनाएँ →",
  "hero.free": "मुफ़्त · 5 मिनट से कम · सब कुछ आपका",
  "hero.already": "पहले से elsewhr पर हैं?",
  "hero.login": "लॉग इन करें →",
  "home.peek": "देखिए कौन पहले से यहाँ है ↓",
  "home.alreadyHere": "लोग जो पहले से elsewhr पर हैं ↓",
  "home.tagline": "असली लोग, अपने असली काम से पहचाने गए।",
  "home.yourPeople": " · आपके जैसे लोग पहले ✦",
  "home.youBoth": "✦ आप दोनों:",
  "home.tapAnyone": "किसी पर टैप करें और उनका काम देखें · असली लोग · लाइव",
  "home.noProfiles": "अभी कोई प्रोफ़ाइल नहीं है।",
  "home.beFirst": "पहले बनिए —",
  "home.join": "elsewhr से जुड़ें",
  "sample.badge": "नमूना प्रोफ़ाइल",
  "sample.long": "नमूना प्रोफ़ाइल — बस आकार दिखाने के लिए",

  "nav.join": "elsewhr से जुड़ें →",
  "nav.me": "मैं",
  "nav.myProfile": "👤 मेरी प्रोफ़ाइल",
  "nav.edit": "✏️ प्रोफ़ाइल बदलें",
  "nav.settings": "⚙️ सेटिंग्स",
  "nav.signout": "👋 साइन आउट",
  "nav.everyone": "← सब लोग",

  "profile.lookingFor": "तलाश है ·",
  "profile.somewhere": "कहीं",
  "profile.showsReal": "असली काम दिखाता है, रिज़्यूमे नहीं",
  "profile.theWork": "काम",
  "profile.learning": "अभी सीख रहे हैं ·",
  "profile.goal": "आगे का लक्ष्य ·",
  "profile.living": "यह elsewhr पर एक जीवंत प्रोफ़ाइल है ·",
  "profile.makeYours": "अपनी बनाएँ",
  "profile.notFound": "प्रोफ़ाइल नहीं मिली।",
  "profile.back": "← elsewhr पर वापस",

  "vouch.title": "किसने भरोसा जताया",
  "vouch.button": "🐦 {name} के लिए भरोसा जताएँ",
  "vouch.explain":
    "उनके काम के बारे में एक ईमानदार वाक्य। आपका नाम और चेहरा इसके साथ जुड़ेगा — सिर्फ़ वही कहिए जो आपने सच में देखा है।",
  "vouch.placeholder": "\"{name} सच में काम पूरा करते हैं — मैंने खुद देखा है।\"",
  "vouch.submit": "मेरा नाम लगाइए",
  "vouch.submitting": "भरोसा जता रहे हैं…",
  "vouch.cancel": "रद्द करें",
  "vouch.none":
    "अभी कोई भरोसा नहीं — यहाँ भरोसा असली elsewhr प्रोफ़ाइल से आता है, नाम और चेहरे के साथ।",
  "vouch.staked": " · असली प्रोफ़ाइल, अपना नाम लगाया है",
  "vouch.member": "एक elsewhr सदस्य",
  "vouch.remove": "हटाएँ",
  "vouch.confirmRemove": "अपना भरोसा हटाएँ?",
  "vouch.short": "थोड़ा और लिखिए — एक ईमानदार वाक्य।",
  "vouch.signIn": "किसी के लिए भरोसा जताने हेतु लॉग इन करें।",

  "reach.button": "✉️ संदेश भेजें",
  "reach.explain":
    "चिड़िया यह {name} को ईमेल से पहुँचाएगी, आपकी प्रोफ़ाइल के साथ। कोई भी दूसरे का पता नहीं देखता — जवाब बस काम करते हैं।",
  "reach.sparks": "🐦 चिड़िया ने कुछ देखा — शुरू करने के लिए टैप करें:",
  "reach.placeholder": "नमस्ते {name} — elsewhr पर आपका काम देखा और…",
  "reach.send": "भेजें 🐦",
  "reach.sending": "भेज रहे हैं…",
  "reach.cancel": "रद्द करें",
  "reach.sent":
    "🐦 भेज दिया। {name} को आपका संदेश ईमेल से मिल गया — जवाब सीधे आपके इनबॉक्स में आएंगे।",
  "reach.short": "थोड़ा और लिखिए — एक-दो असली वाक्य।",
  "reach.failed": "कुछ गड़बड़ हो गई — फिर कोशिश करें।",
};

const pl: Dict = {
  "hero.eyebrow": "cześć, znalazłeś nas 👋",
  "hero.title1": "Gdzie to, co",
  "hero.have": "masz",
  "hero.title2": "znajduje tego, kto tego",
  "hero.needs": "potrzebuje",
  "hero.title3": ".",
  "hero.body":
    "Spawacze, programiści, piekarze, studenci — wszyscy z prawdziwymi umiejętnościami i bez sieci, by je pokazać. Twoja praca, pokazana, nie tylko opisana. Ptak nawet napisze za ciebie profil.",
  "hero.cta": "Stwórz mój profil →",
  "hero.free": "za darmo · poniżej 5 min · wszystko jest twoje",
  "hero.already": "masz już konto na elsewhr?",
  "hero.login": "zaloguj się →",
  "home.peek": "zobacz, kto już tu jest ↓",
  "home.alreadyHere": "ludzie, którzy już są na elsewhr ↓",
  "home.tagline": "prawdziwi ludzie, pokazani przez to, co naprawdę potrafią.",
  "home.yourPeople": " · twoi ludzie najpierw ✦",
  "home.youBoth": "✦ oboje:",
  "home.tapAnyone": "kliknij kogokolwiek, by zobaczyć jego pracę · prawdziwi ludzie · na żywo",
  "home.noProfiles": "Jeszcze nie ma profili.",
  "home.beFirst": "Bądź pierwszy —",
  "home.join": "dołącz do elsewhr",
  "sample.badge": "profil przykładowy",
  "sample.long": "profil przykładowy — pokazuje, jak to wygląda",

  "nav.join": "Dołącz do elsewhr →",
  "nav.me": "ja",
  "nav.myProfile": "👤 Mój profil",
  "nav.edit": "✏️ Edytuj profil",
  "nav.settings": "⚙️ Ustawienia",
  "nav.signout": "👋 Wyloguj",
  "nav.everyone": "← wszyscy",

  "profile.lookingFor": "szuka ·",
  "profile.somewhere": "gdzieś",
  "profile.showsReal": "pokazuje prawdziwą pracę, nie CV",
  "profile.theWork": "Praca",
  "profile.learning": "teraz się uczy ·",
  "profile.goal": "przyszły cel ·",
  "profile.living": "to żywy profil na elsewhr ·",
  "profile.makeYours": "stwórz swój",
  "profile.notFound": "Nie znaleziono profilu.",
  "profile.back": "← wróć do elsewhr",

  "vouch.title": "Poręczyli za niego",
  "vouch.button": "🐦 Poręcz za {name}",
  "vouch.explain":
    "Jedno szczere zdanie o ich pracy. Twoje imię i twarz idą razem z tym — poręczaj tylko za to, co naprawdę widziałeś.",
  "vouch.placeholder": "\"{name} naprawdę dowozi — widziałem, jak pracuje.\"",
  "vouch.submit": "Podpisuję się pod tym",
  "vouch.submitting": "Poręczanie…",
  "vouch.cancel": "Anuluj",
  "vouch.none":
    "jeszcze nikt nie poręczył — poręczenia pochodzą z prawdziwych profili elsewhr, z imieniem i twarzą.",
  "vouch.staked": " · prawdziwy profil, stawia swoje imię",
  "vouch.member": "członek elsewhr",
  "vouch.remove": "usuń",
  "vouch.confirmRemove": "Usunąć twoje poręczenie?",
  "vouch.short": "Napisz trochę więcej — jedno szczere zdanie.",
  "vouch.signIn": "Zaloguj się, aby za kogoś poręczyć.",

  "reach.button": "✉️ Napisz do",
  "reach.explain":
    "Ptak dostarczy to do {name} e-mailem, z twoim profilem w załączniku. Żadne z was nie widzi adresu drugiej osoby — odpowiedzi po prostu działają.",
  "reach.sparks": "🐦 ptak coś zauważył — kliknij, by zacząć:",
  "reach.placeholder": "Cześć {name} — widziałem twoją pracę na elsewhr i…",
  "reach.send": "Wyślij 🐦",
  "reach.sending": "Wysyłanie…",
  "reach.cancel": "Anuluj",
  "reach.sent":
    "🐦 Wysłane. {name} dostał twoją wiadomość e-mailem — odpowiedzi wrócą prosto do twojej skrzynki.",
  "reach.short": "Napisz trochę więcej — jedno, dwa prawdziwe zdania.",
  "reach.failed": "Coś poszło nie tak — spróbuj ponownie.",
};

const fr: Dict = {
  "hero.eyebrow": "salut, tu nous as trouvés 👋",
  "hero.title1": "Là où ce que tu",
  "hero.have": "as",
  "hero.title2": "trouve qui en a",
  "hero.needs": "besoin",
  "hero.title3": ".",
  "hero.body":
    "Soudeurs, développeurs, boulangers, étudiants — tous ceux qui ont un vrai savoir-faire et aucun réseau pour le montrer. Ton travail, montré et pas seulement affirmé. L'oiseau rédige même ton profil.",
  "hero.cta": "Créer mon profil →",
  "hero.free": "gratuit · moins de 5 min · tout t'appartient",
  "hero.already": "déjà sur elsewhr ?",
  "hero.login": "se connecter →",
  "home.peek": "regarde qui est déjà là ↓",
  "home.alreadyHere": "les gens déjà sur elsewhr ↓",
  "home.tagline": "de vraies personnes, montrées par ce qu'elles savent faire.",
  "home.yourPeople": " · tes gens d'abord ✦",
  "home.youBoth": "✦ vous deux :",
  "home.tapAnyone": "clique sur quelqu'un pour voir son travail · vraies personnes · en direct",
  "home.noProfiles": "Pas encore de profils.",
  "home.beFirst": "Sois le premier —",
  "home.join": "rejoins elsewhr",
  "sample.badge": "profil exemple",
  "sample.long": "profil exemple — juste pour montrer la forme",

  "nav.join": "Rejoindre elsewhr →",
  "nav.me": "moi",
  "nav.myProfile": "👤 Mon profil",
  "nav.edit": "✏️ Modifier mon profil",
  "nav.settings": "⚙️ Paramètres",
  "nav.signout": "👋 Se déconnecter",
  "nav.everyone": "← tout le monde",

  "profile.lookingFor": "cherche ·",
  "profile.somewhere": "quelque part",
  "profile.showsReal": "montre du vrai travail, pas un CV",
  "profile.theWork": "Le travail",
  "profile.learning": "apprend en ce moment ·",
  "profile.goal": "objectif futur ·",
  "profile.living": "ceci est un profil vivant sur elsewhr ·",
  "profile.makeYours": "crée le tien",
  "profile.notFound": "Profil introuvable.",
  "profile.back": "← retour à elsewhr",

  "vouch.title": "Recommandé par",
  "vouch.button": "🐦 Recommander {name}",
  "vouch.explain":
    "Une phrase honnête sur leur travail. Ton nom et ton visage y sont attachés — ne recommande que ce que tu as vraiment vu.",
  "vouch.placeholder": "\"{name} livre pour de vrai — je l'ai vu travailler.\"",
  "vouch.submit": "J'y mets mon nom",
  "vouch.submitting": "Recommandation…",
  "vouch.cancel": "Annuler",
  "vouch.none":
    "pas encore de recommandations — elles viennent de vrais profils elsewhr, avec nom et visage.",
  "vouch.staked": " · vrai profil, engage son nom",
  "vouch.member": "un membre d'elsewhr",
  "vouch.remove": "retirer",
  "vouch.confirmRemove": "Retirer ta recommandation ?",
  "vouch.short": "Écris un peu plus — une phrase honnête.",
  "vouch.signIn": "Connecte-toi pour recommander quelqu'un.",

  "reach.button": "✉️ Écrire à",
  "reach.explain":
    "L'oiseau livre ceci à {name} par e-mail, avec ton profil joint. Aucun de vous ne voit l'adresse de l'autre — les réponses fonctionnent simplement.",
  "reach.sparks": "🐦 l'oiseau a remarqué — clique pour commencer :",
  "reach.placeholder": "Salut {name} — j'ai vu ton travail sur elsewhr et…",
  "reach.send": "Envoyer 🐦",
  "reach.sending": "Envoi…",
  "reach.cancel": "Annuler",
  "reach.sent":
    "🐦 Envoyé. {name} a reçu ton message par e-mail — les réponses reviennent directement dans ta boîte.",
  "reach.short": "Écris un peu plus — une vraie phrase ou deux.",
  "reach.failed": "Un problème est survenu — réessaie.",
};

const DICTS: Record<Lang, Dict> = { en, es, pt, hi, pl, fr };

export function t(lang: Lang, key: string, vars?: Record<string, string>): string {
  let s = DICTS[lang]?.[key] ?? DICTS.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp("\\{" + k + "\\}", "g"), v);
    }
  }
  return s;
}

export function aiLanguage(lang: Lang): string {
  return LANGS.find((l) => l.code === lang)?.ai ?? "English";
}
