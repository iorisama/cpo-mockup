using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.UI;
using TMPro; // Pastikan package TextMeshPro sudah terinstal di project Anda
using System.Collections;
using System.Collections.Generic;

[System.Serializable]
public class CPOMachine
{
    public string id;
    public string name;
    public string status; // "ok", "warning", atau "error"
    public float temp;
    public float humidity;
    public float voltage;
    public float current;
}

[System.Serializable]
public class CPONotification
{
    public string id;
    public string machineId;
    public string machineName;
    public string title;
    public string desc;
    public string type;
    public string timestamp;
}

[System.Serializable]
public class CPODashboardData
{
    public CPOMachine[] machines;
    public CPONotification[] notifications;
}

// Class untuk menyambungkan ID Mesin dengan elemen UI di Unity
[System.Serializable]
public class MachineUIBinding
{
    [Tooltip("Masukkan ID mesin, contoh: m1, m2, m3")]
    public string machineId;
    
    [Header("UI Texts")]
    public TextMeshProUGUI nameText;
    public TextMeshProUGUI tempText;
    public TextMeshProUGUI humidityText;
    public TextMeshProUGUI voltageText;
    public TextMeshProUGUI currentText;
    
    [Header("Status Indicator")]
    public Image statusImage;
}

public class CPODashboardReceiver : MonoBehaviour
{
    [Header("Backend Configuration")]
    public string backendUrl = "http://localhost:3001/api/data";
    public float pollInterval = 1f;

    [Header("Alert Pop-up UI")]
    public GameObject alertPanel; // Panel yang akan muncul/hilang
    public TextMeshProUGUI alertTitleText;
    public TextMeshProUGUI alertMachineNameText;
    public TextMeshProUGUI alertDescText;
    public Image alertPanelBackground; // Opsional: untuk mewarnai merah/kuning
    public float alertDisplayDuration = 5f; // Berapa lama alert tampil di layar

    [Header("Machine Data UI")]
    public List<MachineUIBinding> machineUIs;

    [Header("Live Data (Debug)")]
    public CPODashboardData latestData;
    private string lastProcessedNotificationId = "";

    void Start()
    {
        // Sembunyikan panel alert saat pertama kali mulai
        if (alertPanel != null) alertPanel.SetActive(false);
        
        StartCoroutine(PollDataRoutine());
    }

    IEnumerator PollDataRoutine()
    {
        while (true)
        {
            using (UnityWebRequest webRequest = UnityWebRequest.Get(backendUrl))
            {
                yield return webRequest.SendWebRequest();

                if (webRequest.result != UnityWebRequest.Result.ConnectionError && webRequest.result != UnityWebRequest.Result.ProtocolError)
                {
                    string jsonResponse = webRequest.downloadHandler.text;
                    latestData = JsonUtility.FromJson<CPODashboardData>(jsonResponse);
                    
                    ProcessAlerts(latestData);
                    UpdateMachineVisuals(latestData.machines);
                }
            }
            yield return new WaitForSeconds(pollInterval);
        }
    }

    void ProcessAlerts(CPODashboardData data)
    {
        if (data.notifications != null && data.notifications.Length > 0)
        {
            CPONotification newestAlert = data.notifications[0];
            
            if (newestAlert.id != lastProcessedNotificationId)
            {
                lastProcessedNotificationId = newestAlert.id;
                ShowAlertUI(newestAlert);
            }
        }
    }
    
    void ShowAlertUI(CPONotification alert)
    {
        if (alertPanel == null) return;

        // Set teks UI
        if (alertTitleText != null) alertTitleText.text = alert.title;
        if (alertMachineNameText != null) alertMachineNameText.text = "Mesin: " + alert.machineName;
        if (alertDescText != null) alertDescText.text = alert.desc;

        // Ubah warna background panel jika ada (merah untuk error, kuning untuk warning)
        if (alertPanelBackground != null)
        {
            alertPanelBackground.color = alert.type == "error" ? new Color(0.9f, 0.2f, 0.2f, 0.9f) : new Color(0.9f, 0.7f, 0.1f, 0.9f);
        }

        // Tampilkan panel
        alertPanel.SetActive(true);

        // Hapus antrean hide sebelumnya (jika ada alert baru muncul bertubi-tubi)
        StopCoroutine("HideAlertRoutine");
        StartCoroutine("HideAlertRoutine");
    }

    IEnumerator HideAlertRoutine()
    {
        yield return new WaitForSeconds(alertDisplayDuration);
        if (alertPanel != null) alertPanel.SetActive(false);
    }

    void UpdateMachineVisuals(CPOMachine[] machines)
    {
        foreach (var machine in machines)
        {
            // Cari UI Binding yang sesuai dengan ID mesin ini
            MachineUIBinding ui = machineUIs.Find(x => x.machineId == machine.id);
            if (ui != null)
            {
                if (ui.nameText != null) ui.nameText.text = machine.name;
                if (ui.tempText != null) ui.tempText.text = machine.temp.ToString("F1") + " °C";
                if (ui.humidityText != null) ui.humidityText.text = machine.humidity.ToString("F1") + " %";
                if (ui.voltageText != null) ui.voltageText.text = machine.voltage.ToString("F1") + " V";
                if (ui.currentText != null) ui.currentText.text = machine.current.ToString("F1") + " A";

                // Ubah warna indikator status
                if (ui.statusImage != null)
                {
                    if (machine.status == "error") 
                        ui.statusImage.color = Color.red;
                    else if (machine.status == "warning") 
                        ui.statusImage.color = Color.yellow;
                    else 
                        ui.statusImage.color = Color.green;
                }
            }
        }
    }
}
