import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

class ApiService {
  // ── Environment-specific backend URL ──
  static String get baseUrl {
    // Port 8000 is mapped via USB using `adb reverse tcp:8000 tcp:8000`
    return 'http://127.0.0.1:8000';
  }

  // ── Health check ────────────────────────────────────────────────
  static Future<bool> healthCheck() async {
    try {
      final response = await http
          .get(Uri.parse('$baseUrl/health'))
          .timeout(const Duration(seconds: 5));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['ok'] == true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  // ── Analyze plain text ──────────────────────────────────────────
  static Future<Map<String, dynamic>> analyzeText(String text,
      {String? language}) async {
    final body = <String, dynamic>{'text': text};
    if (language != null) body['language'] = language;

    final response = await http
        .post(
          Uri.parse('$baseUrl/api/analyze'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode(body),
        )
        .timeout(const Duration(seconds: 120));

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }
    throw ApiException(
        response.statusCode, jsonDecode(response.body)['error'] ?? 'Unknown error');
  }

  // ── Upload PDF report ───────────────────────────────────────────
  static Future<Map<String, dynamic>> uploadReport(File pdfFile) async {
    final uri = Uri.parse('$baseUrl/api/upload-report');
    final request = http.MultipartRequest('POST', uri);

    request.files.add(
      await http.MultipartFile.fromPath(
        'report',
        pdfFile.path,
        contentType: MediaType('application', 'pdf'),
      ),
    );

    final streamed =
        await request.send().timeout(const Duration(seconds: 120));
    final responseBody = await streamed.stream.bytesToString();

    if (streamed.statusCode == 200) {
      return jsonDecode(responseBody) as Map<String, dynamic>;
    }
    throw ApiException(
        streamed.statusCode, jsonDecode(responseBody)['error'] ?? 'Upload failed');
  }

  // ── Chat follow-up ─────────────────────────────────────────────
  static Future<Map<String, dynamic>> chat(
      String sessionId, String text) async {
    final response = await http
        .post(
          Uri.parse('$baseUrl/api/chat'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'sessionId': sessionId, 'text': text}),
        )
        .timeout(const Duration(seconds: 120));

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }
    throw ApiException(
        response.statusCode, jsonDecode(response.body)['error'] ?? 'Chat error');
  }
}

class ApiException implements Exception {
  final int statusCode;
  final String message;
  ApiException(this.statusCode, this.message);

  @override
  String toString() => 'ApiException($statusCode): $message';
}
