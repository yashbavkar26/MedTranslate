import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class HistoryService {
  static const String _key = 'med_translate_history';

  static Future<List<Map<String, dynamic>>> getReports() async {
    final prefs = await SharedPreferences.getInstance();
    final String? data = prefs.getString(_key);
    
    if (data == null || data.isEmpty) return [];

    try {
      final List<dynamic> decoded = jsonDecode(data);
      return decoded.cast<Map<String, dynamic>>();
    } catch (e) {
      return [];
    }
  }

  static Future<void> saveReport(Map<String, dynamic> report) async {
    final reports = await getReports();
    // Add new report to the beginning
    reports.insert(0, report);
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(reports));
  }
}
