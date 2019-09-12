/****************************************************************************
Copyright (c) 2015-2016 Chukong Technologies Inc.
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
package org.cocos2dx.javascript;

import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.MediaRecorder;
import android.os.Bundle;
import android.os.Environment;
import android.util.Base64;
import android.util.Log;

import com.luck.picture.lib.PictureSelector;
import com.luck.picture.lib.config.PictureConfig;
import com.luck.picture.lib.config.PictureMimeType;
import com.luck.picture.lib.entity.LocalMedia;
import com.luck.picture.lib.tools.PictureFileUtils;

import org.cocos2dx.lib.Cocos2dxActivity;
import org.cocos2dx.lib.Cocos2dxGLSurfaceView;
import org.cocos2dx.lib.Cocos2dxHelper;
import org.cocos2dx.lib.Cocos2dxJavascriptJavaBridge;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.List;
import org.cocos2dx.javascript.ZipUtils;

public class AppActivity extends Cocos2dxActivity {

    private static MediaRecorder sMediaRecorder = null;
    private static String sAudioFilePath = null;

    private static AppActivity sActivity = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        sActivity = this;

        // Workaround in https://stackoverflow.com/questions/16283079/re-launch-of-activity-on-home-button-but-only-the-first-time/16447508
        if (!isTaskRoot()) {
            // Android launched another instance of the root activity into an existing task
            //  so just quietly finish and go away, dropping the user back into the activity
            //  at the top of the stack (ie: the last state of this task)
            // Don't need to finish it again since it's finished in super.onCreate .
            return;
        }
        File cacheDir=getCacheDir();
        Log.i("jsw cacheDir ",cacheDir.getPath());
        Log.i("jsw cacheDir ",cacheDir.toString());

        this.setKeepScreenOn(true);
    }
    
    @Override
    public Cocos2dxGLSurfaceView onCreateView() {
        Cocos2dxGLSurfaceView glSurfaceView = new Cocos2dxGLSurfaceView(this);
        // TestCpp should create stencil buffer
        glSurfaceView.setEGLConfigChooser(5, 6, 5, 0, 16, 8);

        return glSurfaceView;
    }

    public static void startAudio() {
        sMediaRecorder = new MediaRecorder();
        sMediaRecorder.setAudioSource(MediaRecorder.AudioSource.MIC);
        sMediaRecorder.setOutputFormat(MediaRecorder.OutputFormat.AAC_ADTS);
        sMediaRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
        sAudioFilePath = Environment.getExternalStorageDirectory().getPath() + System.currentTimeMillis() + ".aac";
        sMediaRecorder.setOutputFile(sAudioFilePath);
        try {
            sMediaRecorder.prepare();
            sMediaRecorder.start();
        } catch (IllegalStateException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static void stopAudio() {
        if(sMediaRecorder != null) {
            sMediaRecorder.stop();
            sMediaRecorder.release();
            sMediaRecorder = null;

            onMicRecordEnd(readStringFromFile(sAudioFilePath));
        }

        deleteAudioFile();
    }

    private static String readStringFromFile(String filename) {
        String str;
        File file = new File(filename);
        try {
            FileInputStream in = new FileInputStream(file);
            // size  为字串的长度 ，这里一次性读完
            int size = in.available();
            byte[] buffer = new byte[size];
            int length = in.read(buffer);
            in.close();
            str = Base64.encodeToString(buffer, 0, length, Base64.NO_WRAP);
        } catch (IOException e) {
            return null;
        }

        return str;
    }

    private static boolean deleteAudioFile() {
        if(sAudioFilePath == null)
            return false;

        boolean ret = false;
        try {
            File file = new File(sAudioFilePath);
            if (!file.exists()) {
                return true;
            }

            ret = file.delete();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return ret;
    }

    public static void onMicRecordEnd(final String code){
        if(code == null || code.length() < 666) {
            return;
        }

        Cocos2dxActivity activity = (Cocos2dxActivity) Cocos2dxActivity.getContext();
        activity.runOnGLThread(new Runnable() {
            @Override
            public void run() {
                Cocos2dxJavascriptJavaBridge.evalString("gd.setting.sendMic('"+code+"');");
            }
        });
    }

    static int sImageScaleSize = 200;

    public static void pickImage(final int scaleSize) {
        if(scaleSize > 40 && scaleSize <= 1536) {
            sImageScaleSize = scaleSize;
        }

        sActivity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                PictureSelector.create(AppActivity.sActivity)
                        .openGallery(PictureMimeType.ofImage())//全部.PictureMimeType.ofAll()、图片.ofImage()、视频.ofVideo()、音频.ofAudio()
                        .maxSelectNum(1)// 最大图片选择数量 int
                        .minSelectNum(1)// 最小选择数量 int
                        .imageSpanCount(4)// 每行显示个数 int
                        .selectionMode(PictureConfig.SINGLE)// 多选 or 单选 PictureConfig.MULTIPLE or PictureConfig.SINGLE
                        //.previewImage(true)// 是否可预览图片 true or false
                        .isCamera(false)// 是否显示拍照按钮 true or false
                        .isZoomAnim(true)// 图片列表点击 缩放效果 默认true
                        .sizeMultiplier(0.4f)// glide 加载图片大小 0~1之间 如设置 .glideOverride()无效
                        .enableCrop(false)// 是否裁剪 true or false
                        .compress(false)// 是否压缩 true or false
                        .hideBottomControls(false)// 是否显示uCrop工具栏，默认不显示 true or false
                        .isGif(false)// 是否显示gif图片 true or false
                        //.freeStyleCropEnabled(true)// 裁剪框是否可拖拽 true or false
                        //.circleDimmedLayer(false)// 是否圆形裁剪 true or false
                        //.showCropFrame(true)// 是否显示裁剪矩形边框 圆形裁剪时建议设为false   true or false
                        //.showCropGrid(false)// 是否显示裁剪矩形网格 圆形裁剪时建议设为false    true or false
                        .openClickSound(false)// 是否开启点击声音 true or false
                        .previewEggs(true)// 预览图片时 是否增强左右滑动图片体验(图片滑动一半即可看到上一张是否选中) true or false
                        //.cropCompressQuality(65)// 裁剪压缩质量 默认90 int
                        //.minimumCompressSize(30)// 小于30kb的图片不压缩
                        //.synOrAsy(true)//同步true或异步false 压缩 默认同步
                        //.rotateEnabled(false) // 裁剪是否可旋转图片 true or false
                        //.scaleEnabled(true)// 裁剪是否可放大缩小图片 true or false
                        //.isDragFrame(false)// 是否可拖动裁剪框(固定)
                        .forResult(PictureConfig.CHOOSE_REQUEST);//结果回调onActivityResult code
            }
        });
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (resultCode == RESULT_OK) {
            switch (requestCode) {
                case PictureConfig.CHOOSE_REQUEST:
                    boolean pickSuccess = true;
                    String outTempPath = null;
                    do {
                        List<LocalMedia> selectList = PictureSelector.obtainMultipleResult(data);
                        if (selectList == null || selectList.size() < 1) {
                            pickSuccess = false;
                            break;
                        }
                        LocalMedia one = selectList.get(0);

                        String filePath = one.getPath();
                        BitmapFactory.Options options = new BitmapFactory.Options();
                        options.inJustDecodeBounds = true;      // 设置为true，不将图片解码到内存中
                        BitmapFactory.decodeFile(filePath,options);

                        if(options.outHeight < 20 || options.outWidth<20) {
                            pickSuccess = false;
                            break;
                        }

                        int imageHeight = options.outHeight;    // 图片高度
                        int imageWidth = options.outWidth;      // 图片宽度
                        String imageType = options.outMimeType; // 图片类型

                        int scaleW = imageWidth / sImageScaleSize;
                        int scaleH = imageHeight / sImageScaleSize;
                        options = new BitmapFactory.Options();
                        options.inSampleSize = scaleW>scaleH ? scaleH : scaleW;
                        if(options.inSampleSize < 1) {
                            options.inSampleSize = 1;
                        }else if(options.inSampleSize > 8) {
                            options.inSampleSize = 8;
                        }

                        Bitmap thumb = BitmapFactory.decodeFile(filePath,options);

                        File outFile;
                        if(imageType.contains("/png")){
                            outTempPath = Cocos2dxHelper.getWritablePath() + "tmpPickImage.png";
                            outFile = new File(outTempPath);
                            try {
                                BufferedOutputStream bos = new BufferedOutputStream(new FileOutputStream(outFile));
                                thumb.compress(Bitmap.CompressFormat.PNG, 70, bos);
                                bos.flush();
                                bos.close();
                            } catch (IOException e) {
                                pickSuccess = false;
                                e.printStackTrace();
                            }
                        } else {
                            outTempPath = Cocos2dxHelper.getWritablePath() + "tmpPickImage.jpg";
                            outFile = new File(outTempPath);
                            try {
                                BufferedOutputStream bos = new BufferedOutputStream(new FileOutputStream(outFile));
                                thumb.compress(Bitmap.CompressFormat.JPEG, 70, bos);
                                bos.flush();
                                bos.close();
                            } catch (IOException e) {
                                pickSuccess = false;
                                e.printStackTrace();
                            }
                        }

                        PictureFileUtils.deleteCacheDirFile(AppActivity.this);
                    }while (false);

                    final boolean isSuccess = pickSuccess;
                    final String pickImagePath = outTempPath;
                    Cocos2dxActivity activity = (Cocos2dxActivity) Cocos2dxActivity.getContext();
                    activity.runOnGLThread(new Runnable() {
                        @Override
                        public void run() {
                            if(isSuccess && pickImagePath!=null) {
                                Cocos2dxJavascriptJavaBridge.evalString(
                                        "if(gd.onPickImage) gd.onPickImage(1,'" +
                                                pickImagePath + "');");
                            } else {
                                Cocos2dxJavascriptJavaBridge.evalString(
                                        "if(gd.onPickImage) gd.onPickImage(0);");
                            }
                        }});

                    break;
            }
        }
    }

    /**
     * 解压zip文件
     * @param zip_path
     * @param tag_path
     * @return
     */
    public static boolean unZip(String zip_path,String tag_path){
        Log.i("jsw java",Cocos2dxHelper.getWritablePath());
        try {
            ZipUtils.UnZipFolder(zip_path,tag_path);
            return  true;
        }catch (Exception e ){
            Log.i("zip: unzip",e.toString());
        }
        return  false;
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();

        if(sMediaRecorder != null) {
            sMediaRecorder.stop();
            sMediaRecorder.release();
            sMediaRecorder = null;
        }
        deleteAudioFile();

        sActivity = null;
    }
}
