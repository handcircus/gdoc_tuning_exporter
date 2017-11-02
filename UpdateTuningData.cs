// GDoc Tuning Exporter
// (c) 2017 Simon Oliver / HandCircus / hello@handcircus.com
// https://github.com/handcircus/gdoc_tuning_exporter
// Public domain, do with whatever you like, commercial or not
// This comes with no warranty, use at your own risk!

using UnityEngine;
using UnityEditor;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using UnityEngine.Networking;

public class UpdateTuningData : MonoBehaviour {

	public class ExportError {
		public string status;
		public string error;
	}

	private static string ExportSheetScriptURL="PUT_YOUR_WEB_URL_HERE;
		
	private static List<string[]> s_DataUpdateQueue=new List<string[]>();
	static UnityWebRequest www;

	[MenuItem ("Tuning/Update Tuning Data")]
	public static void GetTuningData() {
		
		s_DataUpdateQueue.Clear();
		// ADD ALL SPREADSHEETS YOU WANT DO RETRIEVE CONFIG DATA FROM
		// FIRST PART IS LOCAL FILE NAME TO CACHE (IN ASSETS FOLDER), SECOND IS SPREADSHEET KEY
		s_DataUpdateQueue.Add(new string[]{"TuningData.json","YOUR_SPREADSHEET_KEY_HERE"});
		
		SendNextRequest();
		if (www!=null) EditorApplication.update += EditorUpdate;
	}

	static void SendNextRequest()
    {
		if (s_DataUpdateQueue.Count==0) {
			Debug.LogError("Queue empty - add some items!");
			return;
		} 
		Debug.Log("Retrieving '"+s_DataUpdateQueue[0][0]+"' from sheet '"+s_DataUpdateQueue[0][1]+"'");
		WWWForm form=new WWWForm();
		form.AddField("key", s_DataUpdateQueue[0][1]); // Add spreadsheet key to post darta			
        www = UnityWebRequest.Post(ExportSheetScriptURL,form);
        www.Send();
    }
 
    static void EditorUpdate()
    {
        while (!www.isDone)
            return;
        
		bool error=false;
		string errorMessage="";
		// General error with transport?
        if (www.isError) {
			error=true;
			errorMessage="Error updating data from sheet '"+s_DataUpdateQueue[0][1]+"' : "+www.error;						
		} else {
			// Detect error with data
			try {
				ExportError jsonError=JsonUtility.FromJson<ExportError>(www.downloadHandler.text);
				if (jsonError!=null && jsonError.error!=null) {
					error=true;
					errorMessage="Error updating data from sheet '"+jsonError.error+"'";					
				}
			}
			catch {
				// This is all good, means data is not an error packet 
			}
		}

		if (error) {
			Debug.LogError(errorMessage);
			EditorApplication.update -= EditorUpdate;
		}
        else {			
			Debug.Log("Data successfully received from sheet '"+s_DataUpdateQueue[0][1]+"'");			
			string writePath="Assets/"+s_DataUpdateQueue[0][0];
			System.IO.File.WriteAllText (writePath, www.downloadHandler.text);
			s_DataUpdateQueue.RemoveAt(0);
			if (s_DataUpdateQueue.Count==0) {
				// Queue complete
				EditorApplication.update -= EditorUpdate;
				AssetDatabase.Refresh();
				www=null;
			} else {
				SendNextRequest();
			}			
		}               
    }   
}
