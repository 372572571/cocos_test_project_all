/****************************************************************************
 Copyright (c) 2010-2013 cocos2d-x.org
 Copyright (c) 2013-2016 Chukong Technologies Inc.
 Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.
 
 http://www.cocos2d-x.org
 
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:
 
 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.
 
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

#import "AppController.h"
#import "cocos2d.h"
#import "AppDelegate.h"
#import "RootViewController.h"
#import "SDKWrapper.h"
#import "platform/ios/CCEAGLView-ios.h"

#import "audio/include/AudioEngine.h"
#import "scripting/js-bindings/jswrapper/SeApi.h"

#import <Photos/Photos.h>

using namespace cocos2d;

static AppController* sAppConInstance = nil;

// 选图后的缩放尺寸大小
static unsigned long sImageScaleSize = 200;

@implementation AppController

Application* app = nullptr;
@synthesize window;

#pragma mark -
#pragma mark Application lifecycle

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    //苹果支付
    [[SKPaymentQueue defaultQueue] addTransactionObserver:self];
    sAppConInstance = self;

    [[SDKWrapper getInstance] application:application didFinishLaunchingWithOptions:launchOptions];
    // Add the view controller's view to the window and display.
    float scale = [[UIScreen mainScreen] scale];
    CGRect bounds = [[UIScreen mainScreen] bounds];
    window = [[UIWindow alloc] initWithFrame: bounds];
    
    // cocos2d application instance
    app = new AppDelegate(bounds.size.width * scale, bounds.size.height * scale);
    app->setMultitouch(true);
    
    // Use RootViewController to manage CCEAGLView
    _viewController = [[RootViewController alloc]init];
#ifdef NSFoundationVersionNumber_iOS_7_0
    _viewController.automaticallyAdjustsScrollViewInsets = NO;
    _viewController.extendedLayoutIncludesOpaqueBars = NO;
    _viewController.edgesForExtendedLayout = UIRectEdgeAll;
#else
    _viewController.wantsFullScreenLayout = YES;
#endif
    [window setRootViewController:_viewController];
    
    [window makeKeyAndVisible];
    
    [[UIApplication sharedApplication] setStatusBarHidden:YES];
    
    //run the cocos2d-x game scene
    app->start();
    
    return YES;
}

+ (void) pickImage:(NSNumber *)maxSize {
    auto tmp = [maxSize longValue];
    if(tmp > 40 && tmp <= 1536) {
        sImageScaleSize = tmp;
    }
    
    [sAppConInstance pickImageFile];
}

- (void)pickImageFile{
    PHAuthorizationStatus status = [PHPhotoLibrary authorizationStatus];
    // 2.根据状态进行相应的操作
    switch (status) {
        case PHAuthorizationStatusNotDetermined: { // 用户还没有做出选择
            // 2.1请求获取权限
            [PHPhotoLibrary requestAuthorization:^(PHAuthorizationStatus status) {
                if (status == PHAuthorizationStatusDenied) {
                    // 拒绝授权
                    se::ScriptEngine::getInstance()->evalString("if(gd.onPickImage) gd.onPickImage(2);");
                    return;
                }else if (status == PHAuthorizationStatusAuthorized) {
                    // 授权成功
                }else if (status == PHAuthorizationStatusRestricted) {
                    // 受限制,家长控制,不允许访问
                    se::ScriptEngine::getInstance()->evalString("if(gd.onPickImage) gd.onPickImage(2);");
                    return;
                }
            }];
            break;
        }
        case PHAuthorizationStatusRestricted:
            // 受限制,家长控制,不允许访问
            se::ScriptEngine::getInstance()->evalString("if(gd.onPickImage) gd.onPickImage(2);");
            return;
        case PHAuthorizationStatusDenied:
            // 用户拒绝授权使用相册，需提醒用户到设置里面去开启app相册权限
            se::ScriptEngine::getInstance()->evalString("if(gd.onPickImage) gd.onPickImage(2);");
            return;
        case PHAuthorizationStatusAuthorized:
            // 用户已经授权，可以使用
            break;
        default:
            break;
    }
    
    UIImagePickerController *imagePicker = [[UIImagePickerController alloc] init];
    //设置代理
    imagePicker.delegate = self;
    //允许编辑弹框
    imagePicker.allowsEditing = NO;
    //是用手机相册来获取图片的
    imagePicker.sourceType = UIImagePickerControllerSourceTypeSavedPhotosAlbum;
    
    [self.viewController presentViewController:imagePicker animated:YES completion:nil];
}

//选择完图片后会回调 didFinishPickingMediaWithInfo 这个方法
-(void)imagePickerController:(UIImagePickerController *)picker didFinishPickingMediaWithInfo:(NSDictionary<NSString *,id> *)info {
    //隐藏控制器
    [picker dismissViewControllerAnimated:YES completion:nil];
    
    NSString *type = [info objectForKey:UIImagePickerControllerMediaType];
    //当选择的类型是图片
    if ([type isEqualToString:@"public.image"])
    {
        NSString *key = nil;
        
        if (picker.allowsEditing)
        {
            key = UIImagePickerControllerEditedImage;
        }
        else
        {
            key = UIImagePickerControllerOriginalImage;
        }
        //获取图片
        UIImage *image = [info objectForKey:key];
        NSData *imageData = UIImagePNGRepresentation(image);
        
        NSData * newImageData = [AppController compressImage:imageData toByte:102400 scaleSize:sImageScaleSize];
        
        auto fileUtils = cocos2d::FileUtils::getInstance();
        auto tmpImagePath = fileUtils->getWritablePath() + "tmpPickImage.jpg";
        fileUtils->removeFile(tmpImagePath);
        
        [newImageData writeToFile:[NSString stringWithUTF8String:tmpImagePath.c_str()] atomically:YES];
        
        std::string evStr ="if(gd.onPickImage) gd.onPickImage(1,'";
        evStr.append(tmpImagePath);
        evStr.append("');");
        
        se::ScriptEngine::getInstance()->evalString(evStr.c_str());
        
        return;
    }
    
    se::ScriptEngine::getInstance()->evalString("if(gd.onPickImage) gd.onPickImage(0);");
    cocos2d::log("imagePickerController fail");
}

//导航条上面的 Cancel 的点击方法
-(void)imagePickerControllerDidCancel:(UIImagePickerController *)picker {
    [picker dismissViewControllerAnimated:YES completion:nil];
}

static AVAudioRecorder *audioRecorder = nil;
static std::string sAudioRecordPath;
static NSURL* audioRecordURL = nil;

+ (void)applePay:(NSString*)productID {
    [sAppConInstance applePayImpl:productID];
}

static void postApplePayResult(const char* identifier, const char* receiptData){
    if(identifier && receiptData) {
        std::string evStr ="gd.webSocket.applePayResult('";
        evStr.append(identifier);
        evStr.append("','");
        evStr.append(receiptData);
        evStr.append("');");
        
        se::ScriptEngine::getInstance()->evalString(evStr.c_str());
        
        cocos2d::log("postApplePayResult success");
    } else{
        std::string evStr ="gd.webSocket.applePayResult();";
        se::ScriptEngine::getInstance()->evalString(evStr.c_str());
        
        cocos2d::log("postApplePayResult fail");
    }
}

- (void)applePayImpl:(NSString*)productID {
    if(productID == nil || [productID length] < 1){
        UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"支付提示" message:@"商品ID为空" delegate:self cancelButtonTitle:@"OK" otherButtonTitles:nil, nil];
        [alert show];
        [alert release];
        
        postApplePayResult(nullptr,nullptr);
        return;
    }
    
    if ([SKPaymentQueue canMakePayments]) {
        self.currPrductID = productID;
        
        NSArray *productArr = [[NSArray alloc] initWithObjects:productID, nil];
        NSSet *productSet = [NSSet setWithArray:productArr];
        SKProductsRequest *requset = [[SKProductsRequest alloc] initWithProductIdentifiers:productSet];
        requset.delegate = self;
        [requset start];
    } else{
        UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"支付提示" message:@"苹果支付被限制" delegate:self cancelButtonTitle:@"OK" otherButtonTitles:nil, nil];
        [alert show];
        [alert release];
        
        postApplePayResult(nullptr,nullptr);
    }
}

-(void)productsRequest:(SKProductsRequest *)request didReceiveResponse:(SKProductsResponse *)response
{
    NSArray *productArr = response.products;
    
    if ([productArr count] == 0) {
        UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"支付提示" message:@"没有该商品" delegate:self cancelButtonTitle:@"OK" otherButtonTitles:nil, nil];
        [alert show];
        [alert release];
        
        postApplePayResult(nullptr,nullptr);
        return;
    }
    
    
    SKProduct *p = nil;
    for (SKProduct *pro in productArr) {
        if ([pro.productIdentifier isEqualToString:self.currPrductID]) {
            p = pro;
        }
    }
    
    SKPayment *payment = [SKPayment paymentWithProduct:p];
    [[SKPaymentQueue defaultQueue] addPayment:payment];
}

- (void) requestDidFinish:(SKRequest *)request {
    NSLog(@"苹果支付发起请求成功");
}

- (void) request:(SKRequest *)request didFailWithError:(NSError *)error {
    UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"支付提示" message:@"支付未完成" delegate:self cancelButtonTitle:@"OK" otherButtonTitles:nil, nil];
    [alert show];
    [alert release];
    
    postApplePayResult(nullptr,nullptr);
}

- (void)paymentQueue:(SKPaymentQueue *)queue updatedTransactions:(NSArray<SKPaymentTransaction *> *)transactions{
    for (SKPaymentTransaction *tran in transactions) {
        switch (tran.transactionState) {
            case SKPaymentTransactionStatePurchased: //交易完成
            {
                // 发送到苹果服务器验证凭证
                NSURL *receiptURL = [[NSBundle mainBundle] appStoreReceiptURL];
                NSData *receipt = [NSData dataWithContentsOfURL:receiptURL];
                //receipt-data
                NSString* receiptData = [receipt base64EncodedStringWithOptions:0];
                
                postApplePayResult([tran.transactionIdentifier UTF8String], [receiptData UTF8String]);
                
                [[SKPaymentQueue defaultQueue]finishTransaction:tran];
                break;
            }
            case SKPaymentTransactionStatePurchasing: //商品添加进列表
                break;
            case SKPaymentTransactionStateRestored: //购买过
                [[SKPaymentQueue defaultQueue]finishTransaction:tran];
                break;
            case SKPaymentTransactionStateFailed: //交易失败
                [[SKPaymentQueue defaultQueue]finishTransaction:tran];
                postApplePayResult(nullptr,nullptr);
                break;
            default:
                break;
        }
        
        if (tran.error != nil) {
            NSLog(@"支付错误：%@", [tran.error localizedDescription]);
        }
    }
}


+ (BOOL) isCanRecord
{
    __block BOOL bCanRecord = YES;
    if ([[[UIDevice currentDevice] systemVersion] compare:@"7.0"] != NSOrderedAscending)
    {
        AVAudioSession *audioSession = [AVAudioSession sharedInstance];
        if ([audioSession respondsToSelector:@selector(requestRecordPermission:)]) {
            [audioSession performSelector:@selector(requestRecordPermission:) withObject:^(BOOL granted) {
                bCanRecord = granted;
            }];
        }
    }
    return bCanRecord;
}

// 开始录音
+ (void)startRecord{
    AVAudioSession *audioSession =[AVAudioSession sharedInstance];
    NSError *sessionError;
    [audioSession setCategory:AVAudioSessionCategoryPlayAndRecord error:&sessionError];
    
    if (audioSession == nil) {
        NSLog(@"Error creating session: %@",[sessionError description]);
        return;
    }else{
        [audioSession setActive:YES error:nil];
    }
    
    auto fileUtils = cocos2d::FileUtils::getInstance();
    sAudioRecordPath = fileUtils->getWritablePath() + "IMRecord.aac";
    fileUtils->removeFile(sAudioRecordPath);
    
    //2.获取文件路径
    audioRecordURL = [NSURL fileURLWithPath:[NSString stringWithUTF8String:sAudioRecordPath.c_str()]];
    
    
    //设置参数
    NSDictionary *recordSetting = [[NSDictionary alloc] initWithObjectsAndKeys:
                                   //采样率  8000/11025/22050/44100/96000（影响音频的质量）
                                   [NSNumber numberWithFloat: 11025.0],AVSampleRateKey,
                                   // 音频格式
                                   [NSNumber numberWithInt: kAudioFormatMPEG4AAC],AVFormatIDKey,
                                   //采样位数  8、16、24、32 默认为16
                                   [NSNumber numberWithInt:16],AVLinearPCMBitDepthKey,
                                   // 音频通道数 1 或 2
                                   [NSNumber numberWithInt: 1], AVNumberOfChannelsKey,
                                   //录音质量
                                   [NSNumber numberWithInt:AVAudioQualityHigh],AVEncoderAudioQualityKey,
                                   nil];
    
    NSError *recordError;
    audioRecorder = [[AVAudioRecorder alloc] initWithURL:audioRecordURL settings:recordSetting error:&recordError];
    if (audioRecorder) {
        audioRecorder.delegate = sAppConInstance;
        audioRecorder.meteringEnabled = YES;
        [audioRecorder prepareToRecord];
        [audioRecorder record];
        
        cocos2d::log("ios startRecord ing...");
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(10 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
            [AppController stopRecord];
        });
    } else{
        NSLog(@"Error creating recorder: %@",[recordError description]);
        
        //此处需要恢复设置回放标志，否则会导致其它播放声音也会变小
        [audioSession setCategory:AVAudioSessionCategoryAmbient error:nil];
        [audioSession setActive:YES error:nil];
    }
}

// 停止录音
+ (void)stopRecord{
    cocos2d::log("ios stopRecord");
    if(audioRecorder!=nil){
        [audioRecorder stop];
        audioRecorder = nil;
        
        //此处需要恢复设置回放标志，否则会导致其它播放声音也会变小
        AVAudioSession *session = [AVAudioSession sharedInstance];
        [session setCategory:AVAudioSessionCategoryAmbient error:nil];
        [session setActive:YES error:nil];
    }
}

// 录音结束
- (void)audioRecorderDidFinishRecording:(AVAudioRecorder *)recorder successfully:(BOOL)flag{
    NSFileManager *mgr = [NSFileManager defaultManager];
    NSString* path = [NSString stringWithUTF8String:sAudioRecordPath.c_str()];
    if ([mgr fileExistsAtPath:path])
    {
        unsigned long long size = [[mgr attributesOfItemAtPath:path error:nil] fileSize];
        NSLog(@"文件大小：%lld", size);
        
        NSData *audioData = [NSData dataWithContentsOfFile:path];
        NSString* audioB64Str = [audioData base64EncodedStringWithOptions:0];
        
        //录音数据发送到js层
        std::string evStr ="gd.setting.sendMic('";
        evStr.append([audioB64Str UTF8String]);
        evStr.append("');");
        
        se::ScriptEngine::getInstance()->evalString(evStr.c_str());
    }
}

+ (NSData *)compressImage:(NSData *)data toByte:(NSUInteger)maxLength scaleSize:(NSUInteger)size{
    // Compress by quality
    CGFloat compression = 1;
    if (data.length < maxLength && size==0) return data;
    
    //处理缩放尺寸
    if(size>0){
        UIImage *resultImage = [UIImage imageWithData:data];
        auto sw = size/resultImage.size.width;
        auto sh = size/resultImage.size.height;
        auto scale = sw>sh? sw : sh;
        if(scale < 1.0f) {
            CGSize size = CGSizeMake((NSUInteger)(resultImage.size.width * scale),
                                     (NSUInteger)(resultImage.size.height * scale)); // Use NSUInteger to prevent white blank
            UIGraphicsBeginImageContext(size);
            [resultImage drawInRect:CGRectMake(0, 0, size.width, size.height)];
            resultImage = UIGraphicsGetImageFromCurrentImageContext();
            UIGraphicsEndImageContext();
            data = UIImageJPEGRepresentation(resultImage, compression);
            
            if (data.length <= maxLength) {
                return data;
            }
        }
    }
    
    UIImage* image = [UIImage imageWithData:data];
    
    CGFloat max = 1;
    CGFloat min = 0;
    for (int i = 0; i < 6; ++i) {
        compression = (max + min) / 2;
        data = UIImageJPEGRepresentation(image, compression);
        if (data.length < maxLength * 0.9) {
            min = compression;
        } else if (data.length > maxLength) {
            max = compression;
        } else {
            break;
        }
    }
    
    if (data.length < maxLength)
        return data;
    
    UIImage *resultImage = [UIImage imageWithData:data];
    // Compress by size
    NSUInteger lastDataLength = 0;
    while (data.length > maxLength && data.length != lastDataLength) {
        lastDataLength = data.length;
        CGFloat ratio = (CGFloat)maxLength / data.length;
        CGSize size = CGSizeMake((NSUInteger)(resultImage.size.width * sqrtf(ratio)),
                                 (NSUInteger)(resultImage.size.height * sqrtf(ratio))); // Use NSUInteger to prevent white blank
        UIGraphicsBeginImageContext(size);
        [resultImage drawInRect:CGRectMake(0, 0, size.width, size.height)];
        resultImage = UIGraphicsGetImageFromCurrentImageContext();
        UIGraphicsEndImageContext();
        data = UIImageJPEGRepresentation(resultImage, compression);
    }
    
    return data;
}

- (void)applicationWillResignActive:(UIApplication *)application {
    /*
     Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
     Use this method to pause ongoing tasks, disable timers, and throttle down OpenGL ES frame rates. Games should use this method to pause the game.
     */
    [[SDKWrapper getInstance] applicationWillResignActive:application];
}

- (void)applicationDidBecomeActive:(UIApplication *)application {
    /*
     Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
     */
    [[SDKWrapper getInstance] applicationDidBecomeActive:application];
}

- (void)applicationDidEnterBackground:(UIApplication *)application {
    /*
     Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
     If your application supports background execution, called instead of applicationWillTerminate: when the user quits.
     */
    [[SDKWrapper getInstance] applicationDidEnterBackground:application];
    app->applicationDidEnterBackground();
    
}

- (void)applicationWillEnterForeground:(UIApplication *)application {
    /*
     Called as part of  transition from the background to the inactive state: here you can undo many of the changes made on entering the background.
     */
    [[SDKWrapper getInstance] applicationWillEnterForeground:application];
    app->applicationWillEnterForeground();
    
}

- (void)applicationWillTerminate:(UIApplication *)application
{
    sAppConInstance = nil;

    //移除支付观察者
    [[SKPaymentQueue defaultQueue] removeTransactionObserver:self];

    [[SDKWrapper getInstance] applicationWillTerminate:application];
    delete app;
    app = nil;
}


#pragma mark -
#pragma mark Memory management

- (void)applicationDidReceiveMemoryWarning:(UIApplication *)application {
    /*
     Free up as much memory as possible by purging cached data objects that can be recreated (or reloaded from disk) later.
     */
}

@end
