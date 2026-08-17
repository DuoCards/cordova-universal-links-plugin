#import <Foundation/Foundation.h>

FOUNDATION_EXPORT NSString *const CULContinueUserActivityNotification;

NSArray<NSUserActivity *> *CULConsumePendingUserActivities(void);
void CULDiscardPendingUserActivity(NSUserActivity *userActivity);
