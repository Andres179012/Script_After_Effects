// Función para obtener la ruta del proyecto actual
function getProjectDirectory() {
    var projectFile = app.project.file;
    if (projectFile) {
        return projectFile.path;
    }
    return Folder.desktop.fsName;
}

// Obtener la ruta del directorio del proyecto
var projectPath = getProjectDirectory();

// Cargar el archivo JSON de configuración
var jsonFile = new File(projectPath + "/dataVideo.json");
var jsonData = {};
if (jsonFile.exists) {
    jsonFile.open("r");
    jsonData = JSON.parse(jsonFile.read());
    jsonFile.close();
} else {
    alert("No se encontró dataVideo.json en:\n" + projectPath);
    throw new Error("Archivo JSON no encontrado");
}

// Obtener lista de imágenes de la carpeta /fotos/ ordenadas por número
var photosFolder = new Folder(projectPath + "/fotos/");
var imageFiles = [];
if (photosFolder.exists) {
    var allFiles = photosFolder.getFiles(/\.(jpg|jpeg|png|gif|webp)$/i);
    
    // Ordenar imágenes por número (img1, img2, etc.) insensible a mayúsculas
    for (var i = 1; i <= 14; i++) {
        var imgPattern = new RegExp("^img" + i + "\\.", "i"); // 'i' para insensible a mayúsculas
        for (var j = 0; j < allFiles.length; j++) {
            if (allFiles[j] instanceof File && imgPattern.test(allFiles[j].name)) {
                imageFiles.push(allFiles[j]);
                break;
            }
        }
    }
    
    if (imageFiles.length === 0) {
        alert("No se encontraron imágenes en:\n" + photosFolder.fsName);
    }
} else {
    alert("No se encontró la carpeta /fotos/ en:\n" + projectPath);
    throw new Error("Carpeta de fotos no encontrada");
}

// Mapeo de Medias a imágenes
var mediaImageMapping = [
    { media: "Media 02", imageIndex: 0 },    // img1
    { media: "Media 03.2", imageIndex: 1 },  // img2
    { media: "Media 03.1", imageIndex: 2 },  // img3
    { media: "Media 04.1", imageIndex: 3 },  // img4
    { media: "Media 05.2", imageIndex: 4 },  // img5
    { media: "Media 05.1", imageIndex: 5 },  // img6
    { media: "Media 07.2", imageIndex: 6 },  // img7
    { media: "Media 07.1", imageIndex: 7 },  // img8
    { media: "Media 06.44", imageIndex: 8 }, // img9
    { media: "Media 06.34", imageIndex: 9 }, // img10
    { media: "Media 06.23", imageIndex: 10 }, // img11
    { media: "Media 06.12", imageIndex: 11 }, // img12
    { media: "Media 11.2", imageIndex: 12 },  // img13
    { media: "Media 11.1", imageIndex: 13 }   // img14
];

// Función CORREGIDA para reemplazar imagen en una capa
function replaceMediaWithImage(comp, mediaLayerName, imageFile) {
    if (!comp || !(comp instanceof CompItem) || !imageFile) return;
    
    // CORRECCIÓN: Verificar que la capa existe
    var mediaLayer = null;
    try {
        mediaLayer = comp.layer(mediaLayerName);
    } catch (e) {
        //alert("Capa no encontrada: " + mediaLayerName + " en " + comp.name);
        return;
    }
    
    if (!mediaLayer) return;
    
    try {
        var mediaComp = mediaLayer.source;
        if (mediaComp && mediaComp instanceof CompItem) {
            // Limpiar composición existente
            while (mediaComp.numLayers > 0) {
                mediaComp.layer(1).remove();
            }
            
            // Importar nueva imagen
            var importOptions = new ImportOptions(imageFile);
            var footageItem = app.project.importFile(importOptions);
            
            if (footageItem) {
                var newLayer = mediaComp.layers.add(footageItem);
                
                // Ajustar escala y posición
                var transform = newLayer.property("ADBE Transform Group");
                var scale = transform.property("ADBE Scale");
                var position = transform.property("ADBE Position");
                
                var scaleValue = Math.max(
                    (mediaComp.width / footageItem.width) * 100,
                    (mediaComp.height / footageItem.height) * 100
                );
                
                scale.setValue([scaleValue, scaleValue]);
                position.setValue([mediaComp.width/2, mediaComp.height/2]);
            }
        }
    } catch (e) {
        alert("Error al procesar " + mediaLayerName + ":\n" + e.message);
    }
}

// Función para actualizar textos (sin cambios)
function updateSceneText(comp, sceneData) {
    if (!comp || !(comp instanceof CompItem) || !sceneData) return;
    
    var title1 = sceneData.title || "Texto por defecto";
    var title2 = sceneData.title2 || "";
    
    var textLayers = [];
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        if (layer && layer instanceof TextLayer) {
            textLayers.push(layer);
        }
    }
    
    if (textLayers.length > 0) textLayers[0].text.sourceText.setValue(title1);
    if (textLayers.length > 1 && title2 !== "") textLayers[1].text.sourceText.setValue(title2);
}

// Función principal CORREGIDA
function main() {
    var activeComp = app.project.activeItem;
    if (!activeComp || !(activeComp instanceof CompItem)) {
        alert("No hay una composición activa válida");
        return;
    }

    // 1. Actualizar textos
    for (var i = 1; i <= activeComp.numLayers; i++) {
        var sceneLayer = activeComp.layer(i);
        if (!sceneLayer || !(sceneLayer instanceof AVLayer)) continue;
        
        var sceneName = sceneLayer.name;
        if (!/Scene/i.test(sceneName)) continue;
        
        var sceneData = jsonData[sceneName];
        var sceneComp = sceneLayer.source;

        if (sceneComp && sceneComp instanceof CompItem) {
            updateSceneText(sceneComp, sceneData || {title: "Texto por defecto", title2: ""});
        }
    }

    // 2. Asignar imágenes
    var successCount = 0;
    var missingImages = [];
    
    for (var j = 0; j < mediaImageMapping.length; j++) {
        var mapping = mediaImageMapping[j];
        var imgIndex = mapping.imageIndex;
        
        if (imgIndex >= imageFiles.length) {
            missingImages.push("img" + (imgIndex + 1));
            continue;
        }

        // Buscar el Media en todas las escenas
        for (var i = 1; i <= activeComp.numLayers; i++) {
            var sceneLayer = activeComp.layer(i);
            if (!sceneLayer || !(sceneLayer instanceof AVLayer)) continue;
            
            var sceneComp = sceneLayer.source;
            if (sceneComp && sceneComp instanceof CompItem) {
                replaceMediaWithImage(sceneComp, mapping.media, imageFiles[imgIndex]);
                successCount++;
            }
        }
    }
    
    // Reporte final
    var message = "Proceso completado:\n";
    message += "- Textos actualizados en todas las escenas\n";
    message += "- " + successCount + " asignaciones de imágenes realizadas\n";
    
    if (missingImages.length > 0) {
        message += "\nFaltan imágenes: " + missingImages.join(", ");
    }
    
    alert(message);
}

// Ejecutar
try {
    if (jsonData) {
        main();
    }
} catch (e) {
    alert("Error crítico:\n" + e.message + "\n\n" + e.fileName + " (línea " + e.line + ")");
}