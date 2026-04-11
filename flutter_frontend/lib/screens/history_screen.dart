import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import '../services/history_service.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  List<Map<String, dynamic>> _reports = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    final reports = await HistoryService.getReports();
    if (mounted) {
      setState(() {
        _reports = reports;
        _isLoading = false;
      });
    }
  }

  IconData _getIconForType(String urgency) {
    if (urgency == 'urgent') return Icons.warning_rounded;
    if (urgency == 'soon') return Icons.info_outline_rounded;
    return Icons.check_circle_outline_rounded;
  }

  Color _getColorForScore(int score) {
    if (score >= 90) return AppTheme.successColor;
    if (score >= 70) return AppTheme.warningColor;
    return AppTheme.errorColor;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgColor,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
              child: Row(
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Report History',
                          style: GoogleFonts.inter(
                              fontSize: 24,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.textPrimary)),
                      Text('${_reports.length} reports analysed',
                          style: GoogleFonts.inter(
                              fontSize: 13, color: AppTheme.textSecondary)),
                    ],
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.bgCard,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.borderColor),
                    ),
                    child: const Icon(Icons.filter_list_rounded,
                        color: AppTheme.textSecondary, size: 20),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: AppTheme.bgCard,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppTheme.borderColor),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.search_rounded,
                        color: AppTheme.textSecondary, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        style: GoogleFonts.inter(
                            color: AppTheme.textPrimary, fontSize: 14),
                        decoration: InputDecoration(
                          hintText: 'Search reports...',
                          hintStyle: GoogleFonts.inter(
                              color: AppTheme.textSecondary, fontSize: 14),
                          border: InputBorder.none,
                          contentPadding:
                              const EdgeInsets.symmetric(vertical: 14),
                          filled: false,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _reports.isEmpty
                      ? Center(
                          child: Text('No reports analysed yet.',
                              style: GoogleFonts.inter(
                                  color: AppTheme.textSecondary, fontSize: 14)),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          itemCount: _reports.length,
                          itemBuilder: (context, i) {
                            final r = _reports[i];
                            final score = r['score'] as int? ?? 0;
                            final scoreColor = _getColorForScore(score);
                            // we previously used fixed icons per medical test. Now we'll derive based on urgency.
                            final urgency = r['urgency'] as String? ?? 'self_care';
                            final col = scoreColor;
                            final iconD = _getIconForType(urgency);

                            // The explanation text might be long, let's use it as 'type' or subtitle.
                            final explanation = r['explanation'] as String? ?? '';
                            final title = r['title'] as String? ?? (r['type'] == 'PDF' ? 'Document Upload' : 'Text Analysis');

                            return Container(
                              margin: const EdgeInsets.only(bottom: 14),
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: AppTheme.bgCard,
                                borderRadius: BorderRadius.circular(18),
                                border: Border.all(color: AppTheme.borderColor),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 52,
                                    height: 52,
                                    decoration: BoxDecoration(
                                      color: col.withAlpha(30),
                                      borderRadius: BorderRadius.circular(15),
                                    ),
                                    child: Icon(iconD, color: col, size: 26),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(title,
                                            style: GoogleFonts.inter(
                                                fontSize: 14,
                                                fontWeight: FontWeight.w600,
                                                color: AppTheme.textPrimary)),
                                        const SizedBox(height: 4),
                                        Text(explanation,
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                            style: GoogleFonts.inter(
                                                fontSize: 11,
                                                color: AppTheme.textSecondary)),
                                        const SizedBox(height: 8),
                                        Wrap(
                                          spacing: 6,
                                          runSpacing: 4,
                                          children: ((r['tags'] as List?) ?? [])
                                              .map((tag) => Container(
                                                    padding: const EdgeInsets.symmetric(
                                                        horizontal: 8, vertical: 3),
                                                    decoration: BoxDecoration(
                                                      color: AppTheme.bgCardLight,
                                                      borderRadius:
                                                          BorderRadius.circular(6),
                                                      border: Border.all(
                                                          color: AppTheme.borderColor),
                                                    ),
                                                    child: Text(tag.toString(),
                                                        style: GoogleFonts.inter(
                                                            fontSize: 10,
                                                            color:
                                                                AppTheme.textSecondary)),
                                                  ))
                                              .toList(),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Container(
                                        width: 44,
                                        height: 44,
                                        decoration: BoxDecoration(
                                          color: scoreColor.withAlpha(25),
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(
                                              color: scoreColor.withAlpha(76)),
                                        ),
                                        child: Center(
                                          child: Text('$score',
                                              style: GoogleFonts.inter(
                                                  fontSize: 15,
                                                  fontWeight: FontWeight.w700,
                                                  color: scoreColor)),
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(r['date'] as String? ?? '',
                                          style: GoogleFonts.inter(
                                              fontSize: 10,
                                              color: AppTheme.textSecondary)),
                                    ],
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
