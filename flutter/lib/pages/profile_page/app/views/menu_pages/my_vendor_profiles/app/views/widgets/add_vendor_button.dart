import 'package:flutter/material.dart';
import 'package:trees_india/commons/constants/app_colors.dart';
import 'package:trees_india/commons/constants/app_spacing.dart';
import 'package:trees_india/commons/components/text/app/views/custom_text_library.dart';

class AddVendorButton extends StatelessWidget {
  final VoidCallback onPressed;

  const AddVendorButton({
    super.key,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: AppColors.brandNeutral100,
            width: 1,
          ),
        ),
      ),
      child: GestureDetector(
        onTap: onPressed,
        child: const Row(
          children: [
            Icon(
              Icons.add,
              color: Color(0xFF055c3a),
              size: 20,
            ),
            SizedBox(width: AppSpacing.md),
            Text(
              'Add Vendor Profile',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: Color(0xFF055c3a),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
