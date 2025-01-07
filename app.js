let players = []; // Array für die Spielerdaten
let currentSort = {
    column: 'club', // Standard-Sortierung nach "Team"
    direction: 'asc' // Aufsteigend
};

// Benutzerdefinierte Reihenfolge der Positionen
const positionOrder = ["TW", "IV", "LV", "RV", "ZDM", "ZM", "LM", "RM", "ZOM", "LF", "RF", "HS", "ST"];




// Funktion zum Rendern der Tabelle
function renderTable() {
    const searchValue = document.getElementById('search').value.toLowerCase();
    const teamFilter = document.getElementById('team-filter').value;
    const nationFilter = document.getElementById('nation-filter').value;
    const positionFilter = document.getElementById('position-filter').value;
    const ageMin = parseInt(document.getElementById('min-age').value);
    const ageMax = parseInt(document.getElementById('max-age').value);

    const table = document.getElementById('player-table');
    table.innerHTML = ''; // Tabelle leeren
    

    // Spieler filtern
    const filteredPlayers = players.filter(player => {
        const matchesSearch = player.name.toLowerCase().includes(searchValue);
        const matchesTeam = teamFilter === '' || player.club === teamFilter;
        const matchesNation = nationFilter === '' || player.nation === nationFilter;
        const matchesPosition = positionFilter === '' || player.position === positionFilter;
        const matchesAge = player.age >= ageMin && player.age <= ageMax;

        return matchesSearch && matchesTeam && matchesNation && matchesPosition && matchesAge;
    });

    // Sortiere die Spieler basierend auf der aktuellen Sortierung
    filteredPlayers.sort((a, b) => {
        const valueA = a[currentSort.column];
        const valueB = b[currentSort.column];

        if (currentSort.column === 'position') {
            const indexA = positionOrder.indexOf(a.position);
            const indexB = positionOrder.indexOf(b.position);
            if (indexA < indexB) return currentSort.direction === 'asc' ? -1 : 1;
            if (indexA > indexB) return currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        } else {
            if (valueA < valueB) return currentSort.direction === 'asc' ? -1 : 1;
            if (valueA > valueB) return currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        }
    });

    // Begrenze auf maximal 50 Spieler
    const maxResults = 50;
    const limitedPlayers = filteredPlayers.slice(0, maxResults);

    // Spieler einfügen
    limitedPlayers.forEach(player => {
        // Bestimme die Klasse basierend auf der GES
        let gesClass = '';
        if (player.ges >= 75) {
            gesClass = 'gold';
        } else if (player.ges >= 65) {
            gesClass = 'silver';
        } else {
            gesClass = 'bronze';
        }
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <img src="placeholder.jpg" data-src="${player.ClubLogo}" alt="${player.club}" width="40" loading="lazy" />
            </td>
            <td>${player.club}</td>
            <td class="position ${player.position.toLowerCase()}"><strong>${player.position}</strong></td>
            <td>
                <img src="placeholder.jpg" data-src="${player.image}" alt="${player.name}" width="60" loading="lazy" onerror="this.onerror=null; this.src='placeholder.jpg';" />
            </td>
            <td>${player.name}</td>
            <td>${player.age}</td>
            <td>
                <img src="placeholder.jpg" data-src="${player.NationLogo}" alt="${player.nation}" width="30" loading="lazy" />
            </td>
            <td>${player.nation}</td>
            <td>${player.height}</td>
            <td>${player.weight}</td>
            <td class="ges ${gesClass}">${player.ges}</td>
            <td>${player.talent}</td>
            <td>${player.potential}</td>
            <td>${player.weitpos}</td>
            <td>${player.mw}</td>
            <td>${player.vertrag}</td>
        `;
        table.appendChild(row);
    });


    // Lazy-Loading aktivieren
    activateLazyLoading();

    // Update der Pfeile nach der Sortierung
    updateSortArrows();
}

// Funktion zum Lazy-Loading von Bildern
function activateLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
        // IntersectionObserver für Lazy-Loading erstellen
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img); // Beobachtung nach dem Laden beenden
                }
            });
        });

        // Füge alle Bilder dem Observer hinzu
        images.forEach(img => observer.observe(img));
    } else {
        // Fallback für ältere Browser: Bilder sofort laden
        images.forEach(img => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        });
    }
}


// Excel-Datei laden
function loadExcelFile() {
    fetch('data.xlsx')
        .then(response => response.arrayBuffer())
        .then(data => {
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet);

            players = jsonData.map(player => ({
                ClubLogo: `teamlogos/${player.Verein}.png`,  // Korrektur hier: Template-String für Bildpfad
                name: player.Name,
                club: player.Verein,
                position: player.Position,
                age: player.Alter,
                NationLogo: `nationlogos/${player.Nation}.png`,  // Korrektur hier: Template-String für Bildpfad
                nation: player.Nation,
                height: player.Groesse,
                weight: player.Gewicht,
                ges: player.GES,
                image: `playerpictures/${player.ID}.jpg`,  // Korrektur hier: Template-String für Bildpfad
                talent: player.Talent,
                potential: player.Pot,
                weitpos: player.WeitPos,
                mw: player.MW,
                vertrag: player.Vertrag,
            }));

            populateFilters(); // Filter füllen
            populateAgeDropdowns(); // Altersfilter füllen
            renderTable(); // Tabelle rendern
        })
        .catch(error => console.error('Fehler beim Laden der Excel-Datei:', error));
}


// Filter für Team, Nation, Position füllen
function populateFilters() {
    const teamFilter = document.getElementById('team-filter');
    const nationFilter = document.getElementById('nation-filter');
    const positionFilter = document.getElementById('position-filter');

    const teams = [...new Set(players.map(player => player.club))].sort();
    const nations = [...new Set(players.map(player => player.nation))].sort();
    const customPositionOrder = ["TW", "IV", "LV", "RV", "ZDM", "ZM", "LM", "RM", "ZOM", "LF", "RF", "HS", "ST"];
    const positions = [...new Set(players.map(player => player.position))].sort((a, b) => customPositionOrder.indexOf(a) - customPositionOrder.indexOf(b));

    // Team Dropdown füllen
    teams.forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        teamFilter.appendChild(option);
    });

    // Nation Dropdown füllen
    nations.forEach(nation => {
        const option = document.createElement('option');
        option.value = nation;
        option.textContent = nation;
        nationFilter.appendChild(option);
    });

    // Position Dropdown füllen
    positions.forEach(position => {
        const option = document.createElement('option');
        option.value = position;
        option.textContent = position;
        positionFilter.appendChild(option);
    });
}

// Altersfilter füllen
function populateAgeDropdowns() {
    const minAgeDropdown = document.getElementById('min-age');
    const maxAgeDropdown = document.getElementById('max-age');
    const ageOptions = Array.from({ length: 60 - 9 + 1 }, (_, i) => i + 9);

    ageOptions.forEach(age => {
        const minOption = document.createElement('option');
        const maxOption = document.createElement('option');
        minOption.value = age;
        minOption.textContent = age;
        maxOption.value = age;
        maxOption.textContent = age;
        minAgeDropdown.appendChild(minOption);
        maxAgeDropdown.appendChild(maxOption);
    });

    minAgeDropdown.value = 9;
    maxAgeDropdown.value = 60;
}

// Update der Pfeile (Sortierung)
function updateSortArrows() {
    document.querySelectorAll('th').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
    });

    const headers = document.querySelectorAll('th');
    headers.forEach(header => {
        const columnText = header.textContent.trim().toLowerCase();
        let column;

        if (columnText === 'team') {
            column = 'club';
        } else if (columnText === 'alter') {
            column = 'age';
        } else {
            column = columnText;
        }

        // Wenn diese Spalte sortiert ist, zeige den Pfeil an
        if (column === currentSort.column) {
            header.classList.add(currentSort.direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
        }
    });
}

// Event Listener für Filter
document.getElementById('team-filter').addEventListener('change', () => renderTable());
document.getElementById('nation-filter').addEventListener('change', () => renderTable());
document.getElementById('position-filter').addEventListener('change', () => renderTable());
document.getElementById('min-age').addEventListener('change', () => renderTable());
document.getElementById('max-age').addEventListener('change', () => renderTable());
document.getElementById('search').addEventListener('input', () => renderTable());

// Event Listener für das Klicken auf die Spaltenüberschrift zum Sortieren
document.querySelectorAll('th').forEach(header => {
    header.addEventListener('click', () => {
        let column;
        const columnText = header.textContent.toLowerCase().trim();

        if (columnText === 'team') {
            column = 'club';
        } else if (columnText === 'alter') {
            column = 'age';
        } else if (columnText === 'Groesse') {
            column = 'height';
        } else if (columnText === 'Gewicht') {
            column = 'weight';
        } else if (columnText === 'Pot') {
            column = 'potential';
        } else {
            column = columnText;
        }

        // Wenn auf die gleiche Spalte geklickt wird, wechseln wir die Richtung
        if (currentSort.column === column) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.column = column;
            currentSort.direction = 'asc'; // Standardmäßig aufsteigend
        }

        renderTable(); // Nach Sortierung die Tabelle neu rendern
    });
});

// Excel-Datei automatisch laden
loadExcelFile();