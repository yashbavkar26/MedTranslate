import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import 'login_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  static const _menuItems = [
    {'icon': Icons.person_outline_rounded, 'label': 'Edit Profile',
      'subtitle': 'Update your personal info', 'color': Color(0xFF6C63FF)},
    {'icon': Icons.notifications_outlined, 'label': 'Notifications',
      'subtitle': 'Manage alert preferences', 'color': Color(0xFFFF9F43)},
    {'icon': Icons.language_rounded, 'label': 'Language',
      'subtitle': 'English (Default)', 'color': Color(0xFF00C6AE)},
    {'icon': Icons.security_rounded, 'label': 'Privacy & Security',
      'subtitle': 'Manage your data', 'color': Color(0xFF58A6FF)},
    {'icon': Icons.help_outline_rounded, 'label': 'Help & Support',
      'subtitle': 'FAQs and contact us', 'color': Color(0xFFFF6B6B)},
    {'icon': Icons.info_outline_rounded, 'label': 'About MedTranslate',
      'subtitle': 'Version 1.0.0', 'color': Color(0xFF8B949E)},
  ];

  static const _metrics = [
    {'label': 'Age', 'value': '24', 'unit': 'yrs'},
    {'label': 'Weight', 'value': '70', 'unit': 'kg'},
    {'label': 'Height', 'value': '175', 'unit': 'cm'},
    {'label': 'Blood', 'value': 'O+', 'unit': 'type'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgColor,
      body: SingleChildScrollView(
        child: Column(
          children: [
            // ── Profile Header ──
            Container(
              width: double.infinity,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    AppTheme.bgSecondary,
                    AppTheme.primaryColor.withAlpha(38),
                  ],
                ),
              ),
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 20, 24, 28),
                  child: Column(
                    children: [
                      Text('Profile',
                          style: GoogleFonts.inter(
                              fontSize: 24,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.textPrimary)),
                      const SizedBox(height: 24),
                      Stack(
                        children: [
                          Container(
                            width: 90,
                            height: 90,
                            decoration: BoxDecoration(
                              gradient: AppTheme.primaryGradient,
                              borderRadius: BorderRadius.circular(28),
                              boxShadow: [
                                BoxShadow(
                                  color: AppTheme.primaryColor.withAlpha(90),
                                  blurRadius: 25,
                                  spreadRadius: 5,
                                ),
                              ],
                            ),
                            child: Center(
                              child: Text('G',
                                  style: GoogleFonts.inter(
                                      fontSize: 36,
                                      fontWeight: FontWeight.w800,
                                      color: Colors.white)),
                            ),
                          ),
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                gradient: AppTheme.primaryGradient,
                                borderRadius: BorderRadius.circular(10),
                                border:
                                    Border.all(color: AppTheme.bgColor, width: 2),
                              ),
                              child: const Icon(Icons.camera_alt_rounded,
                                  size: 13, color: Colors.white),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Text('Geetesh Kumar',
                          style: GoogleFonts.inter(
                              fontSize: 20,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.textPrimary)),
                      const SizedBox(height: 4),
                      Text('geetesh@example.com',
                          style: GoogleFonts.inter(
                              fontSize: 13, color: AppTheme.textSecondary)),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 5),
                        decoration: BoxDecoration(
                          gradient: AppTheme.primaryGradient,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text('Patient',
                            style: GoogleFonts.inter(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Colors.white)),
                      ),
                      const SizedBox(height: 20),
                      // Health Metrics
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.bgCard,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: AppTheme.borderColor),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: _metrics.map((m) => Column(
                            children: [
                              Text(m['value']!,
                                  style: GoogleFonts.inter(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.primaryColor)),
                              Text(m['unit']!,
                                  style: GoogleFonts.inter(
                                      fontSize: 10,
                                      color: AppTheme.textSecondary)),
                              const SizedBox(height: 2),
                              Text(m['label']!,
                                  style: GoogleFonts.inter(
                                      fontSize: 12,
                                      color: AppTheme.textPrimary,
                                      fontWeight: FontWeight.w500)),
                            ],
                          )).toList(),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // AI Usage
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: [
                        AppTheme.accentColor.withAlpha(38),
                        AppTheme.primaryColor.withAlpha(25),
                      ]),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(
                          color: AppTheme.accentColor.withAlpha(64)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            gradient: AppTheme.primaryGradient,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(Icons.auto_awesome_rounded,
                              color: Colors.white, size: 20),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('AI Analyses Remaining',
                                  style: GoogleFonts.inter(
                                      fontSize: 13,
                                      color: AppTheme.textSecondary)),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Text('38',
                                      style: GoogleFonts.inter(
                                          fontSize: 22,
                                          fontWeight: FontWeight.w800,
                                          color: AppTheme.primaryColor)),
                                  Text(' / 50 this month',
                                      style: GoogleFonts.inter(
                                          fontSize: 13,
                                          color: AppTheme.textSecondary)),
                                ],
                              ),
                              const SizedBox(height: 6),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(4),
                                child: const LinearProgressIndicator(
                                  value: 38 / 50,
                                  backgroundColor: AppTheme.borderColor,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                      AppTheme.primaryColor),
                                  minHeight: 5,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text('Settings',
                      style: GoogleFonts.inter(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textPrimary)),
                  const SizedBox(height: 12),
                  Container(
                    decoration: BoxDecoration(
                      color: AppTheme.bgCard,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppTheme.borderColor),
                    ),
                    child: Column(
                      children: List.generate(_menuItems.length, (i) {
                        final item = _menuItems[i];
                        final isLast = i == _menuItems.length - 1;
                        return Column(
                          children: [
                            ListTile(
                              contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 4),
                              leading: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: (item['color'] as Color).withAlpha(30),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(item['icon'] as IconData,
                                    color: item['color'] as Color, size: 18),
                              ),
                              title: Text(item['label'] as String,
                                  style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                      color: AppTheme.textPrimary)),
                              subtitle: Text(item['subtitle'] as String,
                                  style: GoogleFonts.inter(
                                      fontSize: 11,
                                      color: AppTheme.textSecondary)),
                              trailing: const Icon(Icons.chevron_right_rounded,
                                  color: AppTheme.textSecondary, size: 20),
                              onTap: () {},
                            ),
                            if (!isLast)
                              const Divider(
                                height: 1,
                                indent: 16,
                                endIndent: 16,
                                color: AppTheme.borderColor,
                              ),
                          ],
                        );
                      }),
                    ),
                  ),
                  const SizedBox(height: 20),
                  // Logout
                  GestureDetector(
                    onTap: () => Navigator.of(context).pushAndRemoveUntil(
                      PageRouteBuilder(
                        pageBuilder: (_, __, ___) => const LoginScreen(),
                        transitionsBuilder: (_, anim, __, child) =>
                            FadeTransition(opacity: anim, child: child),
                      ),
                      (route) => false,
                    ),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      decoration: BoxDecoration(
                        color: AppTheme.errorColor.withAlpha(20),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                            color: AppTheme.errorColor.withAlpha(76)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.logout_rounded,
                              color: AppTheme.errorColor, size: 18),
                          const SizedBox(width: 10),
                          Text('Sign Out',
                              style: GoogleFonts.inter(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.errorColor)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 30),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
