import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { SharedModule } from '../../shared.module';
import { FileUpload } from 'primeng/fileupload'; // Import FileUpload
import { Subscription, of, throwError } from 'rxjs';
import { switchMap, catchError, finalize, tap } from 'rxjs/operators';

// --- Import your services and models ---
import { RecipeService } from '../../service/recipe.service'; // Adjust path as needed
import { FileService } from '../../service/file-upload.service'; // Adjust path as needed for your FileService
import { Recipe, Ingredient } from '../../model/recipes'; // Adjust path as needed
import { RecipeType } from '../../model/recipes';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
// Import specific PrimeNG form modules needed (many might be in SharedModule)
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DropdownModule } from 'primeng/dropdown';
import { TranslateService } from '@ngx-translate/core';
import { InputNumberModule } from 'primeng/inputnumber';


// --- Define Recipe Type options (example) ---
interface RecipeTypeOption {
  label: string;
  value: string;
}

interface FileUploadResponse {
  url?: string;       // Make properties optional if they might not always exist
  fileURL?: string;
  // Add any other properties your FileService might return
}

@Component({
  selector: 'app-recipe-creation',
  imports: [    CommonModule,
    ReactiveFormsModule, // Essential for Reactive Forms
    SharedModule, // Provides common PrimeNG modules
    ToastModule,
    // Explicit imports for clarity or if not fully covered by SharedModule
    InputTextModule,
    InputNumberModule,
    FormsModule,
    TextareaModule,
    DropdownModule,
    ButtonModule,],
  templateUrl: './recipe-creation.component.html',
  styleUrls: ['./recipe-creation.component.scss'], // Adjust if you have specific styles
  providers: [MessageService] // Provide MessageService locally for the toast
})
export class RecipeCreationComponent implements OnInit, OnDestroy {

  @ViewChild('fileUploader') fileUploader?: FileUpload; // Reference to the p-fileUpload component  
  readonly maxFileSizeInMb = 100;


  constructor(
    private fb: FormBuilder,
    private recipeService: RecipeService,
    private fileService: FileService, // Inject FileService
    private messageService: MessageService,
    private translateService: TranslateService,
    private dialogRef: DynamicDialogRef,
    private config: DynamicDialogConfig,
    private cdRef: ChangeDetectorRef // Inject ChangeDetectorRef for preview updates if needed
  ) {}
  recipeForm!: FormGroup;
  isEditMode = false; 
  recipeToEdit?: Recipe;
  recipeTypes: RecipeTypeOption[];

  isScanning = false;

  selectedFile: File | null = null;
  imagePreviewUrl: string | ArrayBuffer | null = null;
  initialImageUrl: string | null = null; // Store original image URL for comparison/reset

  private subscriptions = new Subscription();


  ngOnInit(): void {
    this.recipeToEdit = this.config.data?.recipe;
    this.isEditMode = !!this.recipeToEdit;
    this.initForm();
    this.recipeTypes =  Object.keys(RecipeType).map(key => ({ label: this.translateService.instant(`RECIPE_CATEGORY.${key}`), value: key }));

    if (this.isEditMode && this.recipeToEdit) {
      this.loadRecipeData(this.recipeToEdit);
    } else {
      // Add one empty ingredient row by default for new recipes
      this.addIngredient();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // --- Form Initialization and Management ---

  private initForm(): void {
    this.recipeForm = this.fb.group({
      id: [null],  
      name: ['', Validators.required],
      category: [null, Validators.required],
      description: [''],
      basePortionRatio: [null as number | null], // Added, not required, initialized to null
      imageUrl: [null],
      ingredients: this.fb.array([])
    });
  }
  
  private loadRecipeData(recipe: Recipe): void {
    this.recipeForm.patchValue({
      id: recipe.id, 
      name: recipe.name,
      category: recipe.category,
      description: recipe.description,
      basePortionRatio: recipe.basePortionRatio,
      imageUrl: recipe.imageUrl
    });
  
    this.initialImageUrl = recipe.imageUrl;
    this.ingredients.clear();
    recipe.ingredients?.forEach((ingredient: Ingredient) => {
      this.ingredients.push(this.createIngredientGroup(ingredient));
    });
  
    if (this.ingredients.length === 0) {
      this.addIngredient();
    }
  }

  // ... inside component class
  importUrl: string = ''; // Add this property

  onUrlImport() {
    if (!this.importUrl) return;

    this.isScanning = true;
    this.messageService.add({ severity: 'info', summary: 'Analyse', detail: 'Récupération de la recette en ligne...' });

    this.recipeService.smartImportUrl(this.importUrl).subscribe({
      next: (recipeData) => {
        this.populateForm(recipeData);
        this.isScanning = false;
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Recette importée !' });
        this.importUrl = ''; // Reset
      },
      error: (err) => {
        console.error(err);
        this.isScanning = false;
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de lire ce lien.' });
      }
    });
  }

  // --- Ingredient FormArray Management ---

  onSmartImport(event: any) {
    const file = event.files[0];
    if (!file) return;

    this.isScanning = true;
    // Clear the file upload input if needed to allow re-uploading same file
    // event.originalEvent.target.value = ''; 

    this.recipeService.smartImport(file).subscribe({
      next: (recipeData) => {
        this.populateForm(recipeData);
        this.isScanning = false;
        // Optional: Show success message
      },
      error: (err) => {
        console.error(err);
        this.isScanning = false;
        // Optional: Show error message
      }
    });
  }

  populateForm(data: Recipe) {
    this.recipeForm.patchValue({
      name: data.name,
      description: data.description,
      basePortionRatio: data.basePortionRatio,
      imageUrl: data.imageUrl,
      category: data.category
      // map other fields like prepTime, cookTime if they exist in your form
    });

    // Handle Ingredients Array
    const ingredientsArray = this.recipeForm.get('ingredients') as FormArray;
    ingredientsArray.clear();

    if (data.ingredients) {
      data.ingredients.forEach(ing => {
        ingredientsArray.push(this.fb.group({
          name: [ing.name, Validators.required],
          quantity: [ing.quantity],
          unit: [ing.unit]
        }));
      });
    }
  }

  get ingredients(): FormArray {
    return this.recipeForm.get('ingredients') as FormArray;
  }

  createIngredientGroup(ingredient?: Ingredient): FormGroup {
    return this.fb.group({
      name: [ingredient?.name || '', Validators.required],
      quantity: [ingredient?.quantity || ''], // Keep as string initially if needed
      unit: [ingredient?.unit || '']
    });
  }

  addIngredient(): void {
    this.ingredients.push(this.createIngredientGroup());
  }

  removeIngredient(index: number): void {
    if (this.ingredients.length > 1) {
      this.ingredients.removeAt(index);
    } else {
        // Optionally show a message that at least one ingredient is needed
        this.messageService.add({ severity: 'warn', summary: 'Attention', detail: 'Une recette doit contenir au moins un ingrédient.' });
    }
  }

  // --- Image Upload Handling ---

  onFileSelect(event: any): void {
    // PrimeNG FileUpload event in basic mode with customUpload=true
    // The event object itself often contains the files array directly
    const file = event.files ? event.files[0] : null;

    if (!file) {
      console.error('No file selected in event:', event);
      this.removeImage(); // Clear previous selection if any
      return;
    }

    // Optional: Add client-side validation (type, size)
    if (!file.type.startsWith('image/')) {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Veuillez sélectionner un fichier image valide.' });
        this.clearFileUploader();
        return;
    }
    const maxSize = this.maxFileSizeInMb * 1024 * 1024; // 2MB example
    if (file.size > maxSize) {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: `La taille du fichier ne doit pas dépasser ${this.maxFileSizeInMb / 1024 / 1024} Mo.` });
        this.clearFileUploader();
        return;
    }

    this.selectedFile = file;
    this.imageUrl?.setValue(null); // Clear existing URL when a new file is chosen

    // Generate preview
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreviewUrl = e.target.result;
      this.cdRef.detectChanges(); // Trigger change detection for preview update
    };
    reader.readAsDataURL(file);

    // Note: The fileUploader might clear itself visually due to [auto]="true"
    // If not, you might need: this.fileUploader?.clear();
  }

  removeImage(): void {
    this.selectedFile = null;
    this.imagePreviewUrl = null;
    this.imageUrl?.setValue(null); // Remove URL from form
    this.clearFileUploader();
    this.cdRef.detectChanges(); // Ensure UI updates
  }

  clearFileUploader(): void {
    // Use ViewChild to access the clear method if needed
    this.fileUploader?.clear();
  }


  // --- Form Submission ---

    // --- Form Submission ---

    onSubmit(): void {
      this.recipeForm.markAllAsTouched(); // Mark all fields for validation messages
  
      if (this.recipeForm.invalid) {
        this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Veuillez remplir tous les champs requis.' });
        return;
      } 
  
      // Determine if an upload is needed
      const uploadNeeded = !!this.selectedFile;
      const recipeData = { ...this.recipeForm.value }; // Get current form data
  
      // Create an observable chain: Upload (if needed) -> Save/Update Recipe
      const operation$ = uploadNeeded
        ? this.fileService.postFile(this.selectedFile!).pipe( // Use non-null assertion as we checked 'uploadNeeded'
            tap(uploadResponse => {
              let uploadedUrl: string | undefined;
  
              // Check if the response is a string directly
              if (typeof uploadResponse === 'string') {
                uploadedUrl = uploadResponse;
              }
              // Check if it's an object and try to access known properties
              else if (typeof uploadResponse === 'object' && uploadResponse !== null) {
                // Use type assertion if you defined the interface (or just access directly if you skip the interface)
                const typedResponse = uploadResponse as FileUploadResponse; // Or just uploadResponse
                uploadedUrl = typedResponse?.url || typedResponse?.fileURL;
              }
  
              // Validate the extracted URL
              if (!uploadedUrl || typeof uploadedUrl !== 'string') {
                  console.error("Could not extract a valid URL from upload response:", uploadResponse);
                  throw new Error("L'URL de l'image n'a pas pu être récupérée après l'upload.");
              }
  
              recipeData.imageUrl = uploadedUrl; // Update recipe data with the NEW URL
              this.imageUrl?.setValue(uploadedUrl, { emitEvent: false }); // Also update form control silently
            }),
            switchMap(() => this.saveOrUpdateRecipe(recipeData)), // Proceed to save/update
            catchError(uploadError => {
              console.error('Upload or URL extraction failed:', uploadError);
              // Use the error message from the thrown error if available
              const detailMessage = uploadError instanceof Error ? uploadError.message : "Échec de l'envoi ou du traitement de l'image.";
              this.messageService.add({ severity: 'error', summary: 'Erreur Upload', detail: detailMessage });
              return throwError(() => uploadError); // Propagate error to stop the chain
            })
          )
        : this.saveOrUpdateRecipe(recipeData); // No upload needed, proceed directly
  
      // Execute the operation (rest of the method remains the same)
      this.subscriptions.add(
        operation$.pipe(
          finalize(() => { 
            this.cdRef.detectChanges(); // Ensure UI updates
          })
        ).subscribe({
          next: (savedRecipe: any) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: `Recette ${this.isEditMode ? 'mise à jour' : 'créée'} avec succès!`
            });
            this.dialogRef.close(savedRecipe); // Close dialog and pass back the result
          },
          error: (err: any) => {
            // Error handling for the save/update part (upload errors handled above)
            // Avoid showing duplicate error messages if upload failed
            if (!(err instanceof Error && err.message.includes("L'URL de l'image"))) {
               console.error('Save/Update failed:', err);
               this.messageService.add({
                 severity: 'error',
                 summary: 'Erreur Sauvegarde',
                 detail: `Échec de la ${this.isEditMode ? 'mise à jour' : 'création'} de la recette.`
               });
            }
          }
        })
      );
    }
  
    // Helper to call the correct RecipeService method (remains the same)
    private saveOrUpdateRecipe(recipeData: any) {
      // Clean up ingredients: remove any empty ones (optional)
      recipeData.ingredients = recipeData.ingredients.filter((ing: Ingredient) => ing.name?.trim());
  
      // --- IMPORTANT: ID Check ---
      // Make sure you are using the correct ID property (_id or id) based on your Recipe model
      const recipeId = this.recipeToEdit?.id ?? recipeData.id; // Adjust as per your model
  
      if (this.isEditMode && recipeId) {
        // Pass the ID separately if your service expects it like updateRecipe(id, data)
        // Or ensure recipeData includes the id if service expects updateRecipe(dataWithId)
        // Assuming service expects updateRecipe(id, data):
        return this.recipeService.updateRecipe(recipeData);
        // If service expects updateRecipe(dataWithId):
        // recipeData.id = recipeId; // or recipeData._id = recipeId;
        // return this.recipeService.updateRecipe(recipeData);
      } else {
        // Ensure ID is not sent for creation if backend assigns it
        delete recipeData.id;
        delete recipeData._id;
        return this.recipeService.addRecipe(recipeData);
      }
    }
  
    // --- Dialog Actions --- (remains the same)
    closeDialog(): void {
      this.dialogRef.close(); // Close without saving
    }
  
    // --- Getters for easy template access --- (remains the same)
    get name(): AbstractControl { return this.recipeForm.get('name')!; }
    get category(): AbstractControl { return this.recipeForm.get('category')!; }
    get basePortionRatio() { return this.recipeForm.get('basePortionRatio'); }
    get imageUrl(): AbstractControl { return this.recipeForm.get('imageUrl')!; }
  
}
