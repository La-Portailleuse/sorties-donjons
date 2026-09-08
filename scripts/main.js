const clientSupabase = window.supabase.createClient(
  "https://jjmjchoggafpovnserkt.supabase.co",
  "sb_publishable_4fJdtanT1I6_Lf8qEodURQ_AToj7O7H",
);

const boutonSession = document.querySelector("#changerUtilisateur");
const boutonProfil = document.querySelector("#ouvrirProfil");
const messageBienvenue = document.querySelector("#messageBienvenue");
const dialogue = document.querySelector("#nomDialog");
const formulaire = document.querySelector("#nomForm");
const pseudoInput = document.querySelector("#nomInput");
const emailInput = document.querySelector("#emailInput");
const motDePasseInput = document.querySelector("#passwordInput");
const champsInscription = document.querySelector("#inscriptionFields");
const titreDialogue = document.querySelector("#dialogTitre");
const descriptionDialogue = document.querySelector("#dialogDescription");
const messageAuthentification = document.querySelector("#authMessage");
const boutonValidation = document.querySelector("#authSubmit");
const boutonChangerMode = document.querySelector("#changerMode");
const profilDialogue = document.querySelector("#profilDialog");
const profilFormulaire = document.querySelector("#profilForm");
const pseudoProfilInput = document.querySelector("#pseudoProfil");
const niveauProfilInput = document.querySelector("#niveauProfil");
const discordProfilInput = document.querySelector("#discordProfil");
const photoProfil = document.querySelector("#photoProfil");
const profilMessage = document.querySelector("#profilMessage");
let utilisateurActuel = null;
let classeSelectionnee = 1;
let modeInscription = false;
let utilisateurConnecte = false;
let activites = [];
let triActuel = { colonne: "created_at", sens: "desc" };
let activiteEnEdition = null;

const proposerActivite = document.querySelector("#proposerActivite");
const activiteDialog = document.querySelector("#activiteDialog");
const activiteForm = document.querySelector("#activiteForm");
const activiteType = document.querySelector("#activiteType");
const activiteNom = document.querySelector("#activiteNom");
const activiteNiveau = document.querySelector("#activiteNiveau");
const activiteDescription = document.querySelector("#activiteDescription");
const activiteMessage = document.querySelector("#activiteMessage");
const activitesListe = document.querySelector("#activitesListe");
const activitesMessage = document.querySelector("#activitesMessage");
const listeDonjonsElement = document.querySelector("#listeDonjons");
const membreDialog = document.querySelector("#membreDialog");
const limiteActiviteDialog = document.querySelector("#limiteActiviteDialog");

function afficherErreur(message = "") {
  messageAuthentification.textContent = message;
}

function afficherMessageActivite(message = "") {
  activiteMessage.textContent = message;
}

function mettreAJourBoutonSession() {
  boutonSession.textContent = utilisateurConnecte ? "Déconnexion" : "Connexion";
  boutonProfil.hidden = !utilisateurConnecte;
}

function remplirListeDonjons() {
  listeDonjonsElement.replaceChildren();
  listeDonjons.forEach((donjon) => {
    const option = document.createElement("option");
    option.value = donjon;
    listeDonjonsElement.append(option);
  });
}

async function ouvrirPopupActivite(activite = null) {
  if (!utilisateurConnecte) {
    ouvrirDialogue();
    return;
  }

  if (!activite) {
    const { count, error } = await clientSupabase
      .from("activities")
      .select("id", { count: "exact", head: true })
      .eq("organisateur_id", utilisateurActuel.id);

    if (error) {
      activitesMessage.textContent = "Impossible de vérifier tes activités.";
      return;
    }

    if (count >= 2) {
      limiteActiviteDialog.showModal();
      return;
    }
  }

  activiteEnEdition = activite;
  document.querySelector("#activiteTitre").textContent = activite
    ? "Modifier une activité"
    : "Proposer une activité";
  activiteForm.reset();
  afficherMessageActivite();

  if (activite) {
    activiteType.value = activite.type;
    activiteNom.value = activite.nom;
    activiteNiveau.value = activite.niveau;
    activiteDescription.value = activite.description;
  }

  activiteDialog.showModal();
  activiteType.focus();
}

function afficherCarteMembre(profil) {
  document.querySelector("#membrePhoto").src = `images/classe_${profil.classe_image || 1}.png`;
  document.querySelector("#membrePseudo").textContent = profil.pseudo;
  document.querySelector("#membreNiveau").textContent = profil.niveau;
  document.querySelector("#membreDiscord").textContent = profil.pseudo_discord || "Non renseigné";
  membreDialog.showModal();
}

async function ouvrirCarteMembre(id) {
  const { data, error } = await clientSupabase
    .from("profiles")
    .select("pseudo, niveau, pseudo_discord, classe_image")
    .eq("id", id)
    .single();

  if (error) {
    activitesMessage.textContent = "Impossible de charger la carte de membre.";
    return;
  }

  afficherCarteMembre(data);
}

function activitesFiltrees() {
  return [...activites].sort((a, b) => {
    const valeurA = triActuel.colonne === "organisateur" ? a.profiles?.pseudo : a[triActuel.colonne];
    const valeurB = triActuel.colonne === "organisateur" ? b.profiles?.pseudo : b[triActuel.colonne];
    const comparaison = typeof valeurA === "number"
      ? valeurA - valeurB
      : String(valeurA).localeCompare(String(valeurB), "fr");
    return triActuel.sens === "asc" ? comparaison : -comparaison;
  });
}

function afficherActivites() {
  activitesListe.replaceChildren();

  activitesFiltrees().forEach((activite) => {
    const ligne = document.createElement("tr");
    const valeurs = [activite.type, activite.nom, activite.niveau, activite.description];
    valeurs.forEach((valeur) => {
      const cellule = document.createElement("td");
      cellule.textContent = valeur;
      ligne.append(cellule);
    });

    const organisateur = document.createElement("td");
    const portrait = document.createElement("img");
    portrait.className = "portraitOrganisateur";
    portrait.src = `images/classe_${activite.profiles?.classe_image || 1}.png`;
    portrait.alt = "";
    const lien = document.createElement("button");
    lien.className = "organisateurLien";
    lien.type = "button";
    lien.textContent = activite.profiles?.pseudo || "Inconnu";
    lien.addEventListener("click", () => ouvrirCarteMembre(activite.organisateur_id));
    organisateur.append(portrait, lien);
    ligne.insertBefore(organisateur, ligne.children[3]);

    const actions = document.createElement("td");
    if (utilisateurActuel?.id === activite.organisateur_id) {
      const modifier = document.createElement("button");
      modifier.type = "button";
      modifier.textContent = "Modifier";
      modifier.addEventListener("click", () => ouvrirPopupActivite(activite));
      const supprimer = document.createElement("button");
      supprimer.type = "button";
      supprimer.textContent = "Supprimer";
      supprimer.addEventListener("click", () => supprimerActivite(activite.id));
      actions.append(modifier, supprimer);
    }
    ligne.append(actions);
    activitesListe.append(ligne);
  });
}

async function chargerActivites() {
  if (!utilisateurConnecte) {
    activites = [];
    afficherActivites();
    return;
  }

  const { data, error } = await clientSupabase
    .from("activities")
    .select("id, type, nom, niveau, description, organisateur_id, created_at, profiles!activities_organisateur_id_fkey(pseudo, niveau, pseudo_discord, classe_image)")
    .order("created_at", { ascending: false });

  if (error) {
    activitesMessage.textContent = "Impossible de charger les activités. Exécute le fichier activites.sql dans Supabase.";
    return;
  }

  activites = data;
  afficherActivites();
}

async function supprimerActivite(id) {
  if (!confirm("Supprimer cette activité ?")) {
    return;
  }
  const { error } = await clientSupabase.from("activities").delete().eq("id", id);
  if (error) {
    activitesMessage.textContent = "Impossible de supprimer l'activité.";
    return;
  }
  await chargerActivites();
}

activiteType.addEventListener("change", () => {
  const donjon = activiteType.value === "Donjon";
  activiteNom.setAttribute("list", donjon ? "listeDonjons" : "");
  activiteNom.placeholder = donjon ? "Rechercher un donjon" : "Nom de l'activité";
});

activiteForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  afficherMessageActivite("Enregistrement...");

  const niveau = Number(activiteNiveau.value);
  if (!Number.isInteger(niveau) || niveau < 1 || niveau > 200) {
    afficherMessageActivite("Le niveau doit être un nombre entier entre 1 et 200.");
    return;
  }

  if (activiteType.value === "Donjon" && listeDonjons.length > 0
    && !listeDonjons.includes(activiteNom.value.trim())) {
    afficherMessageActivite("Choisis un donjon dans la liste.");
    return;
  }

  const donnees = {
    type: activiteType.value,
    nom: activiteNom.value.trim(),
    niveau,
    description: activiteDescription.value.trim(),
    organisateur_id: utilisateurActuel.id,
  };
  const requete = activiteEnEdition
    ? clientSupabase.from("activities").update(donnees).eq("id", activiteEnEdition.id)
    : clientSupabase.from("activities").insert(donnees);
  const { error } = await requete;

  if (error) {
    afficherMessageActivite(error.message.includes("ACTIVITES_LIMIT_REACHED")
      ? "Vous ne pouvez pas avoir plus de 2 activités en cours à la fois"
      : "Impossible d'enregistrer cette activité.");
    return;
  }

  activiteDialog.close();
  activiteEnEdition = null;
  await chargerActivites();
});

proposerActivite.addEventListener("click", () => ouvrirPopupActivite());
document.querySelector("#fermerActivite").addEventListener("click", () => activiteDialog.close());
document.querySelector("#annulerActivite").addEventListener("click", () => activiteDialog.close());
document.querySelector("#fermerMembre").addEventListener("click", () => membreDialog.close());
document.querySelector("#fermerLimiteActivite").addEventListener("click", () => limiteActiviteDialog.close());
document.querySelector("#comprisLimiteActivite").addEventListener("click", () => limiteActiviteDialog.close());

activiteDialog.addEventListener("click", (event) => {
  if (event.target === activiteDialog) {
    activiteDialog.close();
  }
});

membreDialog.addEventListener("click", (event) => {
  if (event.target === membreDialog) {
    membreDialog.close();
  }
});

limiteActiviteDialog.addEventListener("click", (event) => {
  if (event.target === limiteActiviteDialog) {
    limiteActiviteDialog.close();
  }
});

document.querySelectorAll("[data-tri]").forEach((bouton) => {
  bouton.addEventListener("click", () => {
    const colonne = bouton.dataset.tri;
    triActuel = {
      colonne,
      sens: triActuel.colonne === colonne && triActuel.sens === "asc" ? "desc" : "asc",
    };
    afficherActivites();
  });
});

function ouvrirDialogue(mode = "connexion") {
  if (dialogue.open) {
    return;
  }

  modeInscription = mode === "inscription";
  formulaire.reset();
  afficherErreur();

  champsInscription.hidden = !modeInscription;
  titreDialogue.textContent = modeInscription ? "Créer un compte" : "Connexion";
  descriptionDialogue.textContent = modeInscription
    ? "Choisis le nom qui sera affiché dans la guilde."
    : "Connecte-toi pour retrouver ton profil.";
  boutonValidation.textContent = modeInscription ? "S'inscrire" : "Se connecter";
  boutonChangerMode.textContent = modeInscription
    ? "J'ai déjà un compte"
    : "Créer un compte";

  dialogue.showModal();
  (modeInscription ? pseudoInput : emailInput).focus();
}

async function afficherProfil(utilisateur) {
  const { data: profil, error } = await clientSupabase
    .from("profiles")
    .select("pseudo")
    .eq("id", utilisateur.id)
    .single();

  if (error) {
    afficherErreur("Profil introuvable.");
    return;
  }

  messageBienvenue.textContent = `Bonjour, ${profil.pseudo} !`;
}

function afficherClasse() {
  photoProfil.src = `images/classe_${classeSelectionnee}.png`;
  photoProfil.alt = `Photo de profil classe ${classeSelectionnee}`;
}

async function ouvrirProfil() {
  if (!utilisateurActuel || profilDialogue.open) {
    return;
  }

  profilMessage.textContent = "Chargement...";
  const { data: profil, error } = await clientSupabase
    .from("profiles")
    .select("pseudo, niveau, pseudo_discord, classe_image")
    .eq("id", utilisateurActuel.id)
    .single();

  if (error) {
    profilMessage.textContent = "Impossible de charger le profil.";
    return;
  }

  pseudoProfilInput.value = profil.pseudo;
  niveauProfilInput.value = profil.niveau;
  discordProfilInput.value = profil.pseudo_discord || "";
  classeSelectionnee = profil.classe_image || 1;
  afficherClasse();
  profilMessage.textContent = "";
  profilDialogue.showModal();
}

async function creerCompte() {
  const { data, error } = await clientSupabase.auth.signUp({
    email: emailInput.value.trim(),
    password: motDePasseInput.value,
    options: { data: { pseudo: pseudoInput.value.trim() } },
  });

  if (error) {
    afficherErreur(error.message);
    return false;
  }

  if (!data.user || !data.session) {
    afficherErreur("Tu vas recevoir un e-mail pour confirmer ton compte !");
    return false;
  }

  utilisateurActuel = data.user;
  messageBienvenue.textContent = `Bonjour, ${pseudoInput.value.trim()} !`;
  return true;
}

async function connecter() {
  const { data, error } = await clientSupabase.auth.signInWithPassword({
    email: emailInput.value.trim(),
    password: motDePasseInput.value,
  });

  if (error) {
    afficherErreur("E-mail ou mot de passe incorrect.");
    return false;
  }

  utilisateurActuel = data.user;
  await afficherProfil(data.user);
  return true;
}

formulaire.addEventListener("submit", async (event) => {
  event.preventDefault();
  afficherErreur("Chargement...");

  const pseudoValide = !modeInscription || pseudoInput.value.trim();

  if (!pseudoValide) {
    afficherErreur("Choisis un nom d'affichage.");
    return;
  }

  const authentificationReussie = modeInscription
    ? await creerCompte()
    : await connecter();

  if (authentificationReussie) {
    utilisateurConnecte = true;
    mettreAJourBoutonSession();
    dialogue.close();
  }
});

boutonChangerMode.addEventListener("click", () => {
  ouvrirDialogue(modeInscription ? "connexion" : "inscription");
});

document.querySelector("#fermerDialog").addEventListener("click", () => dialogue.close());
document.querySelector("#annulerNom").addEventListener("click", () => dialogue.close());

boutonProfil.addEventListener("click", ouvrirProfil);
document.querySelector("#fermerProfil").addEventListener("click", () => profilDialogue.close());
document.querySelector("#annulerProfil").addEventListener("click", () => profilDialogue.close());

document.querySelector("#classePrecedente").addEventListener("click", () => {
  classeSelectionnee = classeSelectionnee === 1 ? 19 : classeSelectionnee - 1;
  afficherClasse();
});

document.querySelector("#classeSuivante").addEventListener("click", () => {
  classeSelectionnee = classeSelectionnee === 19 ? 1 : classeSelectionnee + 1;
  afficherClasse();
});

profilFormulaire.addEventListener("submit", async (event) => {
  event.preventDefault();
  profilMessage.textContent = "Enregistrement...";

  const niveau = Number(niveauProfilInput.value);
  if (!Number.isInteger(niveau) || niveau < 1 || niveau > 200) {
    profilMessage.textContent = "Le niveau doit être un nombre entier entre 1 et 200.";
    return;
  }

  const { error } = await clientSupabase
    .from("profiles")
    .update({
      pseudo: pseudoProfilInput.value.trim(),
      niveau,
      pseudo_discord: discordProfilInput.value.trim() || null,
      classe_image: classeSelectionnee,
    })
    .eq("id", utilisateurActuel.id);

  if (error) {
    profilMessage.textContent = error.code === "23505"
      ? "Ce pseudo est déjà utilisé."
      : "Impossible d'enregistrer le profil.";
    return;
  }

  messageBienvenue.textContent = `Bonjour, ${pseudoProfilInput.value.trim()} !`;
  profilDialogue.close();
});

dialogue.addEventListener("click", (event) => {
  if (event.target === dialogue) {
    dialogue.close();
  }
});

boutonSession.addEventListener("click", async () => {
  if (!utilisateurConnecte) {
    ouvrirDialogue();
    return;
  }

  const { error } = await clientSupabase.auth.signOut();

  if (error) {
    afficherErreur("Impossible de se déconnecter.");
  }
});

clientSupabase.auth.onAuthStateChange((_event, session) => {
  utilisateurActuel = null;
  utilisateurActuel = session?.user || null;
  utilisateurConnecte = Boolean(session);
  mettreAJourBoutonSession();

  if (!session) {
    messageBienvenue.textContent = "";
    chargerActivites();
  } else {
    chargerActivites();
  }
});

async function demarrer() {
  const { data } = await clientSupabase.auth.getSession();
  utilisateurActuel = data.session?.user || null;
  utilisateurConnecte = Boolean(data.session);
  mettreAJourBoutonSession();

  if (data.session) {
    await afficherProfil(data.session.user);
    await chargerActivites();
  } else {
    ouvrirDialogue();
  }
}

remplirListeDonjons();
demarrer();