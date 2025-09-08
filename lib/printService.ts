import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { QRCodeData } from './cloudStorageService';

export class PrintService {
  /**
   * Génère un PDF pour l'impression du QR code
   */
  static async generateQRCodePDF(qrData: QRCodeData): Promise<string> {
    // Utiliser l'API QR Server pour générer l'image du QR code
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData.qrString)}&format=png&color=000000&bgcolor=FFFFFF&margin=15&ecc=M&qzone=2`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>QR Code NotifCar - ${qrData.vehicleName}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #7C3AED, #8B5CF6);
            color: white;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .container {
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 400px;
            width: 100%;
          }
          .header {
            margin-bottom: 30px;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: #7C3AED;
            margin-bottom: 10px;
          }
          .vehicle-name {
            font-size: 24px;
            font-weight: bold;
            color: #1F2937;
            margin-bottom: 5px;
          }
          .vehicle-details {
            color: #6B7280;
            font-size: 16px;
          }
          .qr-container {
            background: #F9FAFB;
            border-radius: 15px;
            padding: 20px;
            margin: 30px 0;
            border: 2px dashed #E5E7EB;
          }
          .qr-image {
            width: 250px;
            height: 250px;
            margin: 0 auto 20px auto;
            border: 3px solid #E5E7EB;
            border-radius: 15px;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          .qr-image img {
            max-width: 100%;
            max-height: 100%;
            border-radius: 10px;
          }
          .qr-code {
            font-family: monospace;
            font-size: 14px;
            color: #1F2937;
            background: white;
            padding: 15px;
            border-radius: 10px;
            border: 1px solid #E5E7EB;
            word-break: break-all;
            margin-top: 15px;
          }
          .instructions {
            margin-top: 30px;
            text-align: left;
          }
          .instruction-title {
            font-size: 18px;
            font-weight: bold;
            color: #1F2937;
            margin-bottom: 15px;
          }
          .instruction-list {
            list-style: none;
            padding: 0;
          }
          .instruction-item {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            color: #4B5563;
          }
          .instruction-icon {
            width: 20px;
            height: 20px;
            background: #7C3AED;
            border-radius: 50%;
            margin-right: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: bold;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
            color: #6B7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🚗 NotifCar</div>
            <div class="vehicle-name">${qrData.vehicleName}</div>
            <div class="vehicle-details">QR Code de sécurité</div>
          </div>
          
          <div class="qr-container">
            <div class="qr-image">
              <img src="${qrCodeUrl}" alt="QR Code NotifCar" style="max-width: 100%; max-height: 100%;" 
                   onerror="this.parentNode.innerHTML='<div style=\'color: #DC2626; font-size: 14px;\'>Erreur de chargement du QR Code</div><div style=\'font-family: monospace; font-size: 12px; margin-top: 10px; word-break: break-all;\'>${qrData.qrString}</div>';" />
            </div>
            <div class="qr-code">${qrData.qrString}</div>
          </div>
          
          <div class="instructions">
            <div class="instruction-title">Instructions d'installation :</div>
            <ul class="instruction-list">
              <li class="instruction-item">
                <div class="instruction-icon">1</div>
                Imprimez ce document sur du papier résistant
              </li>
              <li class="instruction-item">
                <div class="instruction-icon">2</div>
                Découpez le QR code aux dimensions indiquées
              </li>
              <li class="instruction-item">
                <div class="instruction-icon">3</div>
                Collez-le sur le pare-brise intérieur du véhicule
              </li>
              <li class="instruction-item">
                <div class="instruction-icon">4</div>
                Vérifiez qu'il est bien visible de l'extérieur
              </li>
            </ul>
          </div>
          
          <div class="footer">
            <p>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
            <p>ID Véhicule: ${qrData.vehicleId}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
        width: 595, // A4 width in points
        height: 842, // A4 height in points
      });

      return uri;
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      throw new Error('Impossible de générer le PDF');
    }
  }

  /**
   * Partage le PDF généré
   */
  static async shareQRCodePDF(qrData: QRCodeData): Promise<void> {
    try {
      const pdfUri = await this.generateQRCodePDF(qrData);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: `QR Code NotifCar - ${qrData.vehicleName}`,
        });
      } else {
        throw new Error('Le partage n\'est pas disponible sur cet appareil');
      }
    } catch (error) {
      console.error('Erreur partage PDF:', error);
      throw new Error('Impossible de partager le PDF');
    }
  }

  /**
   * Sauvegarde le PDF localement
   */
  static async saveQRCodePDF(qrData: QRCodeData): Promise<string> {
    try {
      const pdfUri = await this.generateQRCodePDF(qrData);
      
      // Copier vers le dossier Documents
      const fileName = `NotifCar_${qrData.vehicleName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      const newUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.copyAsync({
        from: pdfUri,
        to: newUri,
      });

      return newUri;
    } catch (error) {
      console.error('Erreur sauvegarde PDF:', error);
      throw new Error('Impossible de sauvegarder le PDF');
    }
  }

  /**
   * Génère une image du QR code pour le partage
   */
  static async generateQRCodeImage(qrString: string, vehicleName: string): Promise<string> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            margin: 0;
            padding: 20px;
            background: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
          }
          .qr-container {
            background: #F9FAFB;
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            border: 2px solid #E5E7EB;
          }
          .qr-visual {
            width: 200px;
            height: 200px;
            background: #1F2937;
            margin: 20px auto;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            text-align: center;
            line-height: 1.4;
          }
          .vehicle-name {
            font-size: 20px;
            font-weight: bold;
            color: #1F2937;
            margin-bottom: 10px;
          }
          .qr-code {
            font-family: monospace;
            font-size: 12px;
            color: #6B7280;
            background: white;
            padding: 10px;
            border-radius: 8px;
            border: 1px solid #E5E7EB;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="qr-container">
          <div class="vehicle-name">${vehicleName}</div>
          <div class="qr-visual">
            [QR CODE]<br/>
            ${qrString}
          </div>
          <div class="qr-code">${qrString}</div>
        </div>
      </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
        width: 300,
        height: 400,
      });

      return uri;
    } catch (error) {
      console.error('Erreur génération image:', error);
      throw new Error('Impossible de générer l\'image');
    }
  }
}
