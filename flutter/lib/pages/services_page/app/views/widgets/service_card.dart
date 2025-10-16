import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:trees_india/commons/components/text/app/views/custom_text_library.dart';
import '../../../../../commons/constants/app_colors.dart';
import '../../../domain/entities/service_detail_entity.dart';
import '../../../../booking_page/app/providers/booking_providers.dart';

class ServiceCard extends ConsumerWidget {
  final ServiceDetailEntity service;
  final VoidCallback? onTap;

  const ServiceCard({
    super.key,
    required this.service,
    this.onTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingState = ref.watch(bookingNotifierProvider);
    return GestureDetector(
      onTap: onTap ?? () {},
      child: Container(
        color: Colors.transparent,
        width: 160,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Container
            Container(
              height: 100,
              decoration: const BoxDecoration(
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(12),
                  topRight: Radius.circular(12),
                ),
              ),
              child: ClipRRect(
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(12),
                  topRight: Radius.circular(12),
                ),
                child: service.images != null && service.images!.isNotEmpty
                    ? Image.network(
                        service.images!.first,
                        width: double.infinity,
                        height: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            width: double.infinity,
                            height: double.infinity,
                            color: AppColors.brandNeutral200,
                            child: Center(
                              child: Text(
                                service.name.isNotEmpty
                                    ? service.name[0].toUpperCase()
                                    : 'S',
                                style: const TextStyle(
                                  fontSize: 32,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.brandNeutral600,
                                ),
                              ),
                            ),
                          );
                        },
                      )
                    : Container(
                        width: double.infinity,
                        height: double.infinity,
                        color: AppColors.brandNeutral200,
                        child: Center(
                          child: Text(
                            service.name.isNotEmpty
                                ? service.name[0].toUpperCase()
                                : 'S',
                            style: const TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              color: AppColors.brandNeutral600,
                            ),
                          ),
                        ),
                      ),
              ),
            ),

            // Content
            Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title
                  H3Bold(
                    text: service.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),

                  // Price Type Badge
                  service.priceType == 'inquiry'
                      ? B3Regular(
                          text: 'Inquiry Based',
                          color: AppColors.stateGreen600,
                        )
                      : B3Regular(
                          text: 'Fixed Price',
                          color: AppColors.stateGreen600,
                        ),
                  const SizedBox(height: 4),

                  // Price
                  B2Regular(
                    text: service.priceType == 'fixed'
                        ? '₹${service.price}'
                        : 'Inquiry Based',
                  ),
                  const SizedBox(height: 8),

                  B3Regular(
                    text: service.description,
                    color: AppColors.brandNeutral600,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                  ),

                  const SizedBox(height: 16),
                  // Book Now Button
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: () => _navigateToBookingPage(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF055c3a),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(6),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        elevation: 0,
                      ),
                      child: bookingState.isLoading
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor:
                                    AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : const Text(
                              'Book Now',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _navigateToBookingPage(BuildContext context) {
    context.push(
      '/service/${service.id}/booking',
      extra: {
        'service': service,
      },
    );
  }
}
