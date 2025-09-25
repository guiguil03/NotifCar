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
          @font-face { font-family: Inter; src: local('Inter'), local('Arial'); }
          body { font-family: Inter, Arial, sans-serif; margin: 0; padding: 28px; background: #F1F5F9; color: #0F172A; }
          .sheet { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 24px; box-shadow: 0 12px 30px rgba(15,23,42,0.12); border: 1px solid #E2E8F0; }
          .header { padding: 26px 26px 18px 26px; border-bottom: 1px solid #EEF2FF; background: linear-gradient(180deg, rgba(38,51,225,0.06) 0%, rgba(38,51,225,0) 100%); border-top-left-radius: 24px; border-top-right-radius: 24px; text-align: center; }
          .brand { font-size: 30px; font-weight: 900; color: #2633E1; letter-spacing: .2px; }
          .vehicle-name { font-size: 22px; font-weight: 800; color: #0F172A; margin: 8px 0 4px 0; }
          .subtitle { font-size: 14px; color: #475569; }
          .body { padding: 26px; }
          .header {
            margin-bottom: 0;
          }
          .qr-container { background: #F8FAFC; border-radius: 18px; padding: 22px; margin: 22px 0; border: 2px dashed #E2E8F0; }
          .qr-image { width: 260px; height: 260px; margin: 0 auto 16px auto; border-radius: 16px; background: #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 22px rgba(2,6,23,0.08); border: 1px solid #E2E8F0; }
          .qr-image img { max-width: 100%; max-height: 100%; border-radius: 12px; }
          .badge { display: inline-block; padding: 8px 12px; border-radius: 999px; background: #EEF2FF; color: #2633E1; font-weight: 700; font-size: 11px; letter-spacing: 0.3px; }
          .qr-code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; color: #0F172A; background: #ffffff; padding: 12px 14px; border-radius: 12px; border: 1px solid #E2E8F0; white-space: nowrap; overflow-x: auto; word-break: normal; }
          .instructions {
            margin-top: 30px;
            text-align: left;
          }
          .instruction-title {
            font-size: 18px;
            font-weight: bold;
            color: #0F172A;
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
            color: #334155;
          }
          .instruction-icon {
            width: 20px;
            height: 20px;
            background: #2633E1;
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
            margin: 18px 26px 26px 26px;
            padding-top: 14px;
            border-top: 1px solid #E2E8F0;
            color: #475569;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <div class="brand">🚗 NotifCar</div>
            <div class="vehicle-name">${qrData.vehicleName}</div>
            <div class="subtitle">QR Code de sécurité</div>
          </div>
          <div class="body">
          
          <div class="qr-container">
            <div class="qr-image">
              <img src="${qrCodeUrl}" alt="QR Code NotifCar" style="max-width: 100%; max-height: 100%;" 
                   onerror="this.parentNode.innerHTML='<div style=\'color: #DC2626; font-size: 14px;\'>Erreur de chargement du QR Code</div><div style=\'font-family: monospace; font-size: 12px; margin-top: 10px; word-break: break-all;\'>${qrData.qrString}</div>';" />
            </div>
            <div class="badge">CHAÎNE</div>
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
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrString)}&format=png&color=000000&bgcolor=FFFFFF&margin=15&ecc=M&qzone=2`;
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
            width: 250px;
            height: 250px;
            margin: 20px auto;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #FFFFFF;
            border: 2px solid #E5E7EB;
          }
          .qr-visual img { max-width: 100%; max-height: 100%; border-radius: 8px; }
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
            white-space: nowrap;
            overflow-x: auto;
            word-break: normal;
          }
        </style>
      </head>
      <body>
        <div class="qr-container">
          <div class="vehicle-name">${vehicleName}</div>
          <div class="qr-visual">
            <img src="${qrCodeUrl}" alt="QR Code" />
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
