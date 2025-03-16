exports.handler = async function(event) {
  // Vérifier si c'est une requête POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Méthode non autorisée" };
  }
  
  try {
    // Analyser les données du formulaire
    const data = JSON.parse(event.body);
    
    // Ici, vous pourriez envoyer un email, enregistrer dans une base de données, etc.
    console.log("Formulaire reçu:", data);
    
    // Répondre avec succès
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Message reçu avec succès !" })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "Erreur serveur: " + error.message })
    };
  }
}