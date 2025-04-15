import axios from 'axios';


export const fetchStopTimes = async (stopCode) => {
    const response = await axios.get(`https://open.tan.fr/ewp/tempsattente.json/${stopCode}`);
    return response.data;
};

export const fetchStops = async () => {
    const baseUrl = 'https://open.tan.fr/ewp/arrets.json';
    const stops = [];

    try {
        const response = await axios.get(baseUrl);

        response.data.forEach(stop => {
            stops.push({ codeLieu: stop.codeLieu, libelle: stop.libelle, ligne: stop.ligne });
        });

        return stops;
    } catch (error) {
        console.error("Erreur lors de la récupération des arrêts :", error);
        return [];
    }
};


export const fetchDisruptions = async () => {
    const baseUrl = 'https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets/244400404_info-trafic-tan-temps-reel/records?limit=100';

    try {
        const response = await axios.get(baseUrl);
        const records = response.data.results || [];
        const affectedLinesDetails = {};

        records.forEach(record => {
            try {
                // Vérifiez que troncons existe et est une string
                if (!record.troncons || typeof record.troncons !== 'string') return;

                const tronconsArray = record.troncons.split(';');

                tronconsArray.forEach(troncon => {
                    const parts = troncon.split('/');
                    if (parts.length === 0) return;

                    const lineNumber = parts[0].replace('[', '').trim();
                    if (!lineNumber) return;

                    if (!affectedLinesDetails[lineNumber]) {
                        affectedLinesDetails[lineNumber] = [];
                    }

                    affectedLinesDetails[lineNumber].push({
                        intitule: record.intitule || "Sans titre",
                        resume: record.resume || "Aucun détail disponible",
                        date_debut: record.date_debut || "Date inconnue",
                        date_fin: record.date_fin || "Date inconnue",
                        heure_debut: record.heure_debut || "",
                        heure_fin: record.heure_fin || ""
                    });
                });
            } catch (error) {
                console.error('Erreur de parsing des tronçons:', error);
            }
        });

        return affectedLinesDetails;
    } catch (error) {
        console.error('Erreur lors de la récupération des perturbations:', error);
        return {};
    }
};



export const fetchClosestStops = async (lat, long) => {
    const baseUrl = `https://open.tan.fr/ewp/arrets.json/${lat}/${long}`;

    try {
        const response = await axios.get(baseUrl);
        console.log(lat, long)
        console.log(response.data.map(stop => stop.libelle))
        console.log(
            response.data.map(stop => ({
            libelle: stop.libelle,
            distance: stop.distance
        }))
        )
        return response.data.map(stop => ({
            libelle: stop.libelle,
            distance: stop.distance
        }));
    } catch (error) {
        console.error("Erreur lors de la récupération des arrêts les plus proches :", error);
        return [];
    }
};

export const fetchHoraires = async (stopCode, ligne, sens) => {
    if (!stopCode || !ligne || sens === undefined) {
        console.error("Paramètres invalides pour fetchHoraires.");
        return null;
    }

    try {
        const stopTimes = await fetchStopTimes(stopCode);
        console.log("stopTimes récupérés :", stopTimes);

        // On cherche une correspondance avec ligne et sens
        const matchingStop = stopTimes.find(item =>
            item.ligne.numLigne === ligne && item.sens === sens
        );

        if (!matchingStop) {
            console.warn("Aucun arrêt correspondant trouvé.");
            return null;
        }

        const codeArret = matchingStop.arret.codeArret;
        console.log(`Code de l'arrêt utilisé : ${codeArret}`);

        const url = `https://open.tan.fr/ewp/horairesarret.json/${codeArret}/${ligne}/${sens}`;
        console.log("URL des horaires :", url);

        const response = await axios.get(url);
        console.log("Horaires reçus :", response.data);

        return response.data;
    } catch (error) {
        console.error("Erreur lors de la récupération des horaires :", error);
        return null;
    }
};
