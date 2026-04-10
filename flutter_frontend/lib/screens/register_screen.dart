import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import '../widgets/gradient_button.dart';
import '../widgets/glass_input.dart';
import 'home_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen>
    with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _obscurePass = true;
  bool _obscureConfirm = true;
  bool _isLoading = false;
  bool _agreeToTerms = false;
  int _currentStep = 0;
  String _selectedUserType = 'Patient';

  late AnimationController _fadeCtrl;
  late Animation<double> _fade;

  final List<String> _userTypes = ['Patient', 'Doctor', 'Caregiver', 'Researcher'];

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 500));
    _fade = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeIn);
    _fadeCtrl.forward();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    _fadeCtrl.dispose();
    super.dispose();
  }

  void _nextStep() {
    setState(() {
      _currentStep++;
      _fadeCtrl.reset();
      _fadeCtrl.forward();
    });
  }

  void _prevStep() {
    setState(() {
      _currentStep--;
      _fadeCtrl.reset();
      _fadeCtrl.forward();
    });
  }

  Future<void> _register() async {
    if (!_agreeToTerms) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Please agree to Terms & Conditions',
            style: GoogleFonts.inter()),
        backgroundColor: AppTheme.errorColor,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ));
      return;
    }
    setState(() => _isLoading = true);
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) {
      setState(() => _isLoading = false);
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const HomeScreen()),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [AppTheme.bgColor, AppTheme.bgSecondary, Color(0xFF0A1628)],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // ── Top bar ──
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppTheme.bgCard,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.borderColor),
                        ),
                        child: const Icon(Icons.arrow_back_ios_new_rounded,
                            size: 16, color: AppTheme.textPrimary),
                      ),
                    ),
                    const Spacer(),
                    Text('Create Account',
                        style: GoogleFonts.inter(
                            fontSize: 17,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textPrimary)),
                    const Spacer(),
                    const SizedBox(width: 48),
                  ],
                ),
              ),
              // ── Step Progress ──
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  children: [
                    Row(
                      children: List.generate(3, (i) => Expanded(
                        child: Container(
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          height: 4,
                          decoration: BoxDecoration(
                            gradient: i <= _currentStep
                                ? AppTheme.primaryGradient
                                : null,
                            color: i > _currentStep ? AppTheme.borderColor : null,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      )),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Step ${_currentStep + 1} of 3',
                            style: GoogleFonts.inter(
                                fontSize: 12, color: AppTheme.textSecondary)),
                        Text(
                          ['Personal Info', 'Security', 'Preferences'][_currentStep],
                          style: GoogleFonts.inter(
                              fontSize: 12,
                              color: AppTheme.primaryColor,
                              fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              // ── Form ──
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: FadeTransition(
                    opacity: _fade,
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 16),
                          if (_currentStep == 0) ..._step1(),
                          if (_currentStep == 1) ..._step2(),
                          if (_currentStep == 2) ..._step3(),
                          const SizedBox(height: 24),
                          if (_currentStep < 2)
                            GradientButton(label: 'Continue', onPressed: _nextStep)
                          else
                            GradientButton(
                                label: 'Create Account',
                                isLoading: _isLoading,
                                onPressed: _register),
                          if (_currentStep > 0) ...[
                            const SizedBox(height: 12),
                            Center(
                              child: TextButton(
                                onPressed: _prevStep,
                                child: Text('Go Back',
                                    style: GoogleFonts.inter(
                                        fontSize: 14,
                                        color: AppTheme.textSecondary)),
                              ),
                            ),
                          ],
                          Center(
                            child: TextButton(
                              onPressed: () => Navigator.pop(context),
                              child: RichText(
                                text: TextSpan(
                                  text: 'Already have an account? ',
                                  style: GoogleFonts.inter(
                                      fontSize: 14, color: AppTheme.textSecondary),
                                  children: [
                                    TextSpan(
                                      text: 'Sign In',
                                      style: GoogleFonts.inter(
                                          fontSize: 14,
                                          color: AppTheme.primaryColor,
                                          fontWeight: FontWeight.w600),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _step1() => [
    Text('Personal Information',
        style: GoogleFonts.inter(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: AppTheme.textPrimary)),
    const SizedBox(height: 6),
    Text('Tell us a bit about yourself',
        style: GoogleFonts.inter(fontSize: 14, color: AppTheme.textSecondary)),
    const SizedBox(height: 24),
    GlassInput(
        controller: _nameController,
        label: 'Full Name',
        hint: 'John Doe',
        prefixIcon: Icons.person_outline_rounded,
        validator: (v) => v == null || v.isEmpty ? 'Full name is required' : null),
    const SizedBox(height: 16),
    GlassInput(
        controller: _emailController,
        label: 'Email Address',
        hint: 'your@email.com',
        prefixIcon: Icons.email_outlined,
        keyboardType: TextInputType.emailAddress,
        validator: (v) {
          if (v == null || v.isEmpty) return 'Email is required';
          if (!v.contains('@')) return 'Enter a valid email';
          return null;
        }),
    const SizedBox(height: 16),
    GlassInput(
        controller: _phoneController,
        label: 'Phone Number',
        hint: '+91 9876543210',
        prefixIcon: Icons.phone_outlined,
        keyboardType: TextInputType.phone,
        validator: (v) =>
            v == null || v.isEmpty ? 'Phone number is required' : null),
  ];

  List<Widget> _step2() => [
    Text('Secure Your Account',
        style: GoogleFonts.inter(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: AppTheme.textPrimary)),
    const SizedBox(height: 6),
    Text('Create a strong password',
        style: GoogleFonts.inter(fontSize: 14, color: AppTheme.textSecondary)),
    const SizedBox(height: 24),
    GlassInput(
        controller: _passwordController,
        label: 'Password',
        hint: '••••••••',
        prefixIcon: Icons.lock_outline_rounded,
        obscureText: _obscurePass,
        suffixIcon: IconButton(
          icon: Icon(
              _obscurePass
                  ? Icons.visibility_outlined
                  : Icons.visibility_off_outlined,
              color: AppTheme.textSecondary),
          onPressed: () => setState(() => _obscurePass = !_obscurePass),
        ),
        validator: (v) {
          if (v == null || v.isEmpty) return 'Password is required';
          if (v.length < 8) return 'Minimum 8 characters required';
          return null;
        }),
    const SizedBox(height: 16),
    GlassInput(
        controller: _confirmController,
        label: 'Confirm Password',
        hint: '••••••••',
        prefixIcon: Icons.lock_outline_rounded,
        obscureText: _obscureConfirm,
        suffixIcon: IconButton(
          icon: Icon(
              _obscureConfirm
                  ? Icons.visibility_outlined
                  : Icons.visibility_off_outlined,
              color: AppTheme.textSecondary),
          onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
        ),
        validator: (v) =>
            v != _passwordController.text ? 'Passwords do not match' : null),
    const SizedBox(height: 16),
    _PasswordStrength(password: _passwordController.text),
  ];

  List<Widget> _step3() => [
    Text('Set Your Preferences',
        style: GoogleFonts.inter(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: AppTheme.textPrimary)),
    const SizedBox(height: 6),
    Text('Personalise your experience',
        style: GoogleFonts.inter(fontSize: 14, color: AppTheme.textSecondary)),
    const SizedBox(height: 24),
    Text('I am a...',
        style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: AppTheme.textSecondary)),
    const SizedBox(height: 12),
    Wrap(
      spacing: 10,
      runSpacing: 10,
      children: _userTypes.map((type) {
        final isSelected = _selectedUserType == type;
        return GestureDetector(
          onTap: () => setState(() => _selectedUserType = type),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: BoxDecoration(
              gradient: isSelected ? AppTheme.primaryGradient : null,
              color: isSelected ? null : AppTheme.bgCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                  color: isSelected ? Colors.transparent : AppTheme.borderColor),
              boxShadow: isSelected
                  ? [
                      BoxShadow(
                          color: AppTheme.primaryColor.withAlpha(76),
                          blurRadius: 12,
                          spreadRadius: 2)
                    ]
                  : null,
            ),
            child: Text(type,
                style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight:
                        isSelected ? FontWeight.w600 : FontWeight.w400,
                    color: isSelected
                        ? Colors.white
                        : AppTheme.textSecondary)),
          ),
        );
      }).toList(),
    ),
    const SizedBox(height: 24),
    Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 20,
            height: 20,
            child: Checkbox(
              value: _agreeToTerms,
              onChanged: (v) => setState(() => _agreeToTerms = v!),
              activeColor: AppTheme.primaryColor,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(4)),
              side: const BorderSide(color: AppTheme.borderColor),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: RichText(
              text: TextSpan(
                text: "I agree to MedTranslate's ",
                style: GoogleFonts.inter(
                    fontSize: 13, color: AppTheme.textSecondary),
                children: [
                  TextSpan(
                    text: 'Terms of Service',
                    style: GoogleFonts.inter(
                        color: AppTheme.primaryColor,
                        fontWeight: FontWeight.w500,
                        fontSize: 13),
                  ),
                  TextSpan(
                    text: ' and ',
                    style: GoogleFonts.inter(
                        fontSize: 13, color: AppTheme.textSecondary),
                  ),
                  TextSpan(
                    text: 'Privacy Policy',
                    style: GoogleFonts.inter(
                        color: AppTheme.primaryColor,
                        fontWeight: FontWeight.w500,
                        fontSize: 13),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ),
  ];
}

class _PasswordStrength extends StatelessWidget {
  final String password;
  const _PasswordStrength({required this.password});

  int get _score {
    if (password.length < 4) return 0;
    if (password.length < 8) return 1;
    int s = 1;
    if (password.contains(RegExp(r'[A-Z]'))) s++;
    if (password.contains(RegExp(r'[0-9]'))) s++;
    if (password.contains(RegExp(r'[!@#$%^&*]'))) s++;
    return s.clamp(0, 4);
  }

  static const _labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  static const _colors = [
    Colors.transparent,
    AppTheme.errorColor,
    AppTheme.warningColor,
    AppTheme.infoColor,
    AppTheme.successColor,
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: List.generate(
            4,
            (i) => Expanded(
              child: Container(
                margin: const EdgeInsets.only(right: 6),
                height: 4,
                decoration: BoxDecoration(
                  color: i < _score ? _colors[_score] : AppTheme.borderColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
          ),
        ),
        if (_score > 0)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(
              'Password strength: ${_labels[_score]}',
              style: GoogleFonts.inter(fontSize: 12, color: _colors[_score]),
            ),
          ),
      ],
    );
  }
}
