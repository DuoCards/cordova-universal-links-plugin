#import "CULSceneDelegateHandler.h"
#import <objc/runtime.h>

static NSMutableArray<NSUserActivity *> *pendingUserActivities;
static IMP originalSceneWillConnectImplementation;
NSString *const CULContinueUserActivityNotification = @"CDVPluginContinueUserActivityNotification";

@interface CULSceneDelegateHandler : NSObject
@end

static void CULSceneWillConnect(id sceneDelegate, SEL selector, id scene, id session, id connectionOptions) {
    NSSet<NSUserActivity *> *userActivities = [connectionOptions valueForKey:@"userActivities"];
    for (NSUserActivity *userActivity in userActivities) {
        @synchronized ([CULSceneDelegateHandler class]) {
            if (pendingUserActivities == nil) {
                pendingUserActivities = [[NSMutableArray alloc] init];
            }
            [pendingUserActivities addObject:userActivity];
        }

        [[NSNotificationCenter defaultCenter] postNotificationName:CULContinueUserActivityNotification
                                                            object:userActivity];
    }

    ((void (*)(id, SEL, id, id, id))originalSceneWillConnectImplementation)(sceneDelegate, selector, scene, session, connectionOptions);
}

@implementation CULSceneDelegateHandler

+ (void)load {
    Class sceneDelegateClass = NSClassFromString(@"CDVSceneDelegate");
    SEL selector = NSSelectorFromString(@"scene:willConnectToSession:options:");
    Method method = class_getInstanceMethod(sceneDelegateClass, selector);
    if (method == NULL) {
        return;
    }

    originalSceneWillConnectImplementation = method_getImplementation(method);
    method_setImplementation(method, (IMP)CULSceneWillConnect);
}

@end

NSArray<NSUserActivity *> *CULConsumePendingUserActivities(void) {
    @synchronized ([CULSceneDelegateHandler class]) {
        NSArray<NSUserActivity *> *activities = [pendingUserActivities copy] ?: @[];
        [pendingUserActivities removeAllObjects];
        return activities;
    }
}

void CULDiscardPendingUserActivity(NSUserActivity *userActivity) {
    @synchronized ([CULSceneDelegateHandler class]) {
        [pendingUserActivities removeObjectIdenticalTo:userActivity];
    }
}
