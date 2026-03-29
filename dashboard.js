// ==========================================
// MOTOR VISUAL: Lector y Dibujante de PDFs
// ==========================================
// Le decimos a PDF.js dónde está su "trabajador"
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';

async function dibujarPDFenLienzo(archivo) {
    // Verificamos que sea un PDF antes de intentar dibujarlo
    if (archivo.type !== "application/pdf") {
        document.getElementById('lienzo-espacio').classList.add('oculto');
        return;
    }

    const fileReader = new FileReader();
    
    fileReader.onload = async function(e) {
        const typedarray = new Uint8Array(e.target.result);

        try {
            // Cargamos el documento completo
            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            const grid = document.getElementById('pdf-grid');
            
            // Limpiamos la mesa de trabajo por si había otro PDF antes
            grid.innerHTML = ''; 
            
            // Mostramos la mesa de trabajo (le quitamos la clase oculto)
            document.getElementById('lienzo-espacio').classList.remove('oculto');

            // Dibujamos página por página
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                // Usamos escala 1.5 para que se vea nítido
                const viewport = page.getViewport({ scale: 1.5 }); 

                // Creamos la "tarjeta" blanca para la página
                const divContenedor = document.createElement('div');
                divContenedor.className = 'pagina-pdf';

                // Creamos el lienzo (canvas) donde se pintará la imagen
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                // Ordenamos que se pinte
                await page.render({ canvasContext: context, viewport: viewport }).promise;

                // Le ponemos su número abajo
                const etiquetaNumero = document.createElement('span');
                etiquetaNumero.className = 'numero-pagina';
                etiquetaNumero.textContent = `Página ${pageNum}`;

                // Juntamos todo y lo ponemos en la mesa
                divContenedor.appendChild(canvas);
                divContenedor.appendChild(etiquetaNumero);
                grid.appendChild(divContenedor);
            }
        } catch (error) {
            console.error("Error al leer el PDF:", error);
        }
    };
    
    fileReader.readAsArrayBuffer(archivo);
}
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // URL DE TU CEREBRO EN RAILWAY
    const API_URL = "https://moyxyom-backend-production.up.railway.app/process";

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    const processBtn = document.getElementById('process-btn');
    const statusDiv = document.getElementById('status');
    const toolBtns = document.querySelectorAll('.tool-btn, .tool-btnacc');
    const currentActionText = document.getElementById('current-action-text');

    let archivosSeleccionados = [];
    let accionActual = "pdf-to-docx"; // Acción por defecto

    // --- 1. Lógica del Menú Predictivo ---
    toolBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Cambiar botón activo visualmente
            document.querySelector('.tool-btn.active')?.classList.remove('active');
            btn.classList.add('active');

            // Actualizar acción y textos predictivos
            accionActual = btn.dataset.action;
            currentActionText.innerText = btn.innerText;
            
            // Si cambiamos de herramienta, limpiamos archivos antiguos para no confundir
            archivosSeleccionados = [];
            actualizarInterfaz();
        });
    });

    // --- 2. Lógica de Arrastre Ágil ---
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => manejarArchivos(e.target.files));

    // Efectos visuales de arrastre
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragging'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragging');
        manejarArchivos(e.dataTransfer.files);
    });

    function manejarArchivos(files) {
        if (!files.length) return;
        
        // Convertir la lista de archivos a un arreglo real
        const nuevosArchivos = Array.from(files);

        // Lógica predictiva: si es unir, sumamos archivos. Si es convertir, solo agarramos el primero.
        if (accionActual === "merge") {
            archivosSeleccionados = [...archivosSeleccionados, ...nuevosArchivos];
        } else {
            archivosSeleccionados = [nuevosArchivos[0]]; // Solo el primero para conversiones/ocr
        }
        
        actualizarInterfaz();

        // ¡AQUÍ ESTÁ EL LUGAR CORRECTO! Dibujar el PDF en pantalla una vez procesados
        if (archivosSeleccionados.length > 0) {
            dibujarPDFenLienzo(archivosSeleccionados[0]);
        }
    }

    // Actualiza la lista de archivos y habilita el botón de iniciar
    function actualizarInterfaz() {
        fileList.innerHTML = "";
        
        if (archivosSeleccionados.length > 0) {
            archivosSeleccionados.forEach(file => {
                const item = document.createElement('div');
                item.classList.add('file-item');
                item.innerText = `📄 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
                fileList.appendChild(item);
            });
            
            // Habilitar botón si cumple requisitos
            if (accionActual === "merge") {
                processBtn.disabled = archivosSeleccionados.length < 2;
                statusDiv.innerText = archivosSeleccionados.length < 2 ? "⚠️ Sube al menos 2 PDFs" : "¡Listo para unir!";
            } else {
                processBtn.disabled = false;
                statusDiv.innerText = "¡Listo para procesar!";
            }
            dropZone.querySelector('.drop-content').style.display = 'none'; // Escondemos texto inicial

        } else {
            processBtn.disabled = true;
            statusDiv.innerText = "Esperando archivo...";
            dropZone.querySelector('.drop-content').style.display = 'block'; // Mostramos texto inicial
            // Escondemos el lienzo si no hay archivos
            const lienzo = document.getElementById('lienzo-espacio');
            if(lienzo) lienzo.classList.add('oculto');
        }
    }








// --- AUTO-GUARDADO DE LLAVE VIP ---
const vipInput = document.getElementById('vip-key');

// Al cargar la página, ver si ya había una llave guardada
document.addEventListener('DOMContentLoaded', () => {
    const llaveGuardada = localStorage.getItem('mi_llave_moyxyom');
    if (llaveGuardada) {
        vipInput.value = llaveGuardada;
    }
});

// Cada vez que el usuario escribe, guardamos la llave automáticamente
vipInput.addEventListener('input', () => {
    localStorage.setItem('mi_llave_moyxyom', vipInput.value);
});








    // --- 3. Lógica de Envío al Cerebro (La Acción) ---
    processBtn.addEventListener('click', async () => {
        if (archivosSeleccionados.length === 0) return;

        const vipKey = document.getElementById('vip-key').value;
        const formData = new FormData();
        
        // Empaquetamos todos los archivos
        archivosSeleccionados.forEach(file => formData.append('files', file));
        formData.append('action', accionActual);
        if (vipKey) formData.append('vip_key', vipKey);

        statusDiv.innerText = `⏳ MOYXYOM Pro está trabajando... (${currentActionText.innerText})`;
        statusDiv.style.color = "var(--confianza)";
        processBtn.disabled = true;

        try {
            const respuesta = await fetch(API_URL, { method: 'POST', body: formData });

            if (!respuesta.ok) {
                const errorData = await respuesta.json();
                throw new Error(errorData.detail || "Error en el servidor");
            }

            // Atrapamos el archivo final (Blob)
            const masaDeDatos = await respuesta.blob();

            // Generamos el nombre correcto de forma inteligente según la herramienta
            let nombreBase = archivosSeleccionados[0].name.split('.')[0]; 
            let nombreFinal = "MOYXYOM_" + nombreBase;
            
            if (accionActual === "pdf-to-docx") nombreFinal += ".docx";
            else if (accionActual === "docx-to-pdf") nombreFinal += ".pdf";
            else if (accionActual === "ocr") nombreFinal += "_texto.txt";
            else if (accionActual === "merge") nombreFinal = "MOYXYOM_Unidos.pdf";
            else if (accionActual === "split") nombreFinal += "_paginas.zip";
            else if (accionActual === "extract-images") nombreFinal += "_imagenes.zip";
            
            // Descarga Automática Ágil
            const linkInvisible = document.createElement('a');
            linkInvisible.href = window.URL.createObjectURL(masaDeDatos);
            linkInvisible.download = nombreFinal;
            linkInvisible.click();

            statusDiv.innerText = `✅ ¡Trabajo completado exitosamente! Descargando...`;
            statusDiv.style.color = "var(--verde)";

        } catch (error) {
            statusDiv.innerText = `❌ Error: ${error.message}`;
            statusDiv.style.color = "red";
        } finally {
            processBtn.disabled = false;
        }
    });
});